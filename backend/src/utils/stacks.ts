import axios from 'axios';
import {
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { generateWallet } from '@stacks/wallet-sdk';

// ─── Configuration ────────────────────────────────
const STACKS_API_URL =
  process.env.STACKS_API_URL || 'https://api.testnet.hiro.so';
const FACILITATOR_URL =
  process.env.FACILITATOR_URL || 'https://x402-backend-7eby.onrender.com';
const STACKS_NETWORK = process.env.STACKS_NETWORK || 'testnet';
const ESCROW_SECRET = process.env.ESCROW_PRIVATE_KEY || '';
export const ESCROW_WALLET = process.env.PLATFORM_WALLET || 'ST2G2JR5QANPE9HJTW7HT8RZW4CFWM44B6NM12YXX';

// ─── Derive hex private key from mnemonic or passthrough hex ──
let _escrowPrivateKeyCache: string | null = null;

async function getEscrowPrivateKey(): Promise<string> {
  if (_escrowPrivateKeyCache) return _escrowPrivateKeyCache;
  if (!ESCROW_SECRET) return '';

  // If it looks like hex (64-char hex string), use directly
  if (/^[0-9a-fA-F]{64}$/.test(ESCROW_SECRET.trim())) {
    _escrowPrivateKeyCache = ESCROW_SECRET.trim();
    console.log('[Escrow] Using hex private key directly');
    return _escrowPrivateKeyCache;
  }

  // Otherwise treat as 24-word mnemonic seed phrase
  try {
    const wallet = await generateWallet({
      secretKey: ESCROW_SECRET.trim(),
      password: '',
    });
    const account = wallet.accounts[0];
    _escrowPrivateKeyCache = account.stxPrivateKey;
    console.log('[Escrow] Derived private key from mnemonic seed phrase');
    return _escrowPrivateKeyCache;
  } catch (err: any) {
    console.error('[Escrow] Failed to derive key from mnemonic:', err.message);
    return '';
  }
}

// ─── CAIP-2 Network Identifier ────────────────────
export function getNetworkCAIP2(): string {
  return STACKS_NETWORK === 'mainnet' ? 'stacks:1' : 'stacks:2147483648';
}

// ─── Build x402 V2 payment-required header payload ─
export function buildPaymentRequiredHeader(
  amountSTX: number,
  payTo: string,
  resource?: string,
  description?: string
) {
  const amountMicroSTX = Math.round(amountSTX * 1_000_000).toString();
  return {
    x402Version: 2,
    paymentRequirements: [
      {
        scheme: 'exact',
        network: getNetworkCAIP2(),
        maxAmountRequired: amountMicroSTX,
        resource: resource || '',
        description: description || '',
        mimeType: 'application/json',
        payTo,
        maxTimeoutSeconds: 300,
        asset: 'STX',
        extra: null,
      },
    ],
  };
}

// ─── Build single payment-requirements object ─────
export function buildPaymentRequirements(amountSTX: number, payTo: string) {
  const amountMicroSTX = Math.round(amountSTX * 1_000_000).toString();
  return {
    scheme: 'exact',
    network: getNetworkCAIP2(),
    amount: amountMicroSTX,
    asset: 'STX',
    payTo,
    maxTimeoutSeconds: 300,
  };
}

// ─── Encode / Decode base64 headers ───────────────
export function encodeHeader(data: unknown): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decodeHeader(header: string): any | null {
  try {
    return JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

// ─── Build payment-response header payload ────────
export function buildPaymentResponse(txId: string, payer: string) {
  return {
    success: true,
    transaction: txId,
    payer,
    network: getNetworkCAIP2(),
  };
}

// ─── Verify an already-broadcast transaction via Hiro API ──
export async function verifyStacksTx(
  txHash: string,
  expectedAmountSTX: number,
  expectedRecipient: string
): Promise<{ valid: boolean; message: string; payer?: string }> {
  if (!txHash || txHash.trim().length < 10) {
    return { valid: false, message: 'Invalid transaction hash format' };
  }

  try {
    const cleanHash = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
    const res = await axios.get(
      `${STACKS_API_URL}/extended/v1/tx/${cleanHash}`,
      { timeout: 15000 }
    );
    const tx = res.data;

    if (tx.tx_type !== 'token_transfer') {
      return { valid: false, message: 'Transaction is not an STX token transfer' };
    }

    if (tx.tx_status !== 'success' && tx.tx_status !== 'pending') {
      return {
        valid: false,
        message: `Transaction failed with status: ${tx.tx_status}`,
      };
    }

    if (tx.token_transfer?.recipient_address !== expectedRecipient) {
      return {
        valid: false,
        message: `Recipient mismatch: expected ${expectedRecipient}, got ${tx.token_transfer?.recipient_address}`,
      };
    }

    const expectedMicroSTX = Math.round(expectedAmountSTX * 1_000_000);
    const actualMicroSTX = parseInt(tx.token_transfer?.amount || '0', 10);
    if (actualMicroSTX < expectedMicroSTX) {
      return {
        valid: false,
        message: `Amount too low: expected ${expectedMicroSTX} µSTX, got ${actualMicroSTX} µSTX`,
      };
    }

    return {
      valid: true,
      message: `Transaction verified (status: ${tx.tx_status})`,
      payer: tx.sender_address,
    };
  } catch (err: any) {
    if (err.response?.status === 404) {
      // Transaction very recently broadcast — not yet indexed
      return {
        valid: true,
        message: 'Transaction submitted — awaiting indexing',
        payer: undefined,
      };
    }
    return {
      valid: false,
      message: `Verification failed: ${err.message}`,
    };
  }
}

// ─── Transfer STX from escrow wallet (server-side) ──────────
export async function transferFromEscrow(
  recipientAddress: string,
  amountSTX: number,
  memo?: string
): Promise<{ success: boolean; txId?: string; error?: string }> {
  const senderKey = await getEscrowPrivateKey();

  if (!senderKey) {
    console.warn('[Escrow] ESCROW_PRIVATE_KEY not configured — skipping on-chain transfer');
    return { success: false, error: 'Escrow private key not configured' };
  }

  try {
    const network = STACKS_NETWORK === 'mainnet'
      ? new StacksMainnet()
      : new StacksTestnet();

    const amountMicroSTX = BigInt(Math.round(amountSTX * 1_000_000));

    const txOptions = {
      recipient: recipientAddress,
      amount: amountMicroSTX,
      senderKey,
      network,
      memo: memo || '',
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeSTXTokenTransfer(txOptions);
    const broadcastResult = await broadcastTransaction(transaction, network);

    if (typeof broadcastResult === 'string') {
      // broadcastResult is the txId on success
      console.log(`[Escrow] Transfer broadcast OK: ${broadcastResult}`);
      return { success: true, txId: broadcastResult };
    }

    if ((broadcastResult as any).error) {
      console.error('[Escrow] Broadcast error:', (broadcastResult as any).error, (broadcastResult as any).reason);
      return { success: false, error: (broadcastResult as any).reason || (broadcastResult as any).error };
    }

    const txId = (broadcastResult as any).txid || (broadcastResult as any).txId || String(broadcastResult);
    console.log(`[Escrow] Transfer broadcast OK: ${txId}`);
    return { success: true, txId };
  } catch (err: any) {
    console.error('[Escrow] Transfer failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Settle a signed (unbroadcast) tx via x402 facilitator ──
export async function settleTxViaFacilitator(
  signedTxHex: string,
  paymentRequirements: ReturnType<typeof buildPaymentRequirements>
): Promise<{
  success: boolean;
  transaction?: string;
  payer?: string;
  error?: string;
}> {
  try {
    const res = await axios.post(
      `${FACILITATOR_URL}/settle`,
      {
        x402Version: 2,
        paymentPayload: {
          x402Version: 2,
          payload: { transaction: signedTxHex },
          accepted: paymentRequirements,
        },
        paymentRequirements,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120_000,
      }
    );

    return {
      success: res.data.success,
      transaction: res.data.transaction,
      payer: res.data.payer,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || err.message,
    };
  }
}
