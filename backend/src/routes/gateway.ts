import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import multer from 'multer';
import prisma from '../db/client';
import {
  verifyStacksTx,
  settleTxViaFacilitator,
  buildPaymentRequiredHeader,
  buildPaymentRequirements,
  buildPaymentResponse,
  encodeHeader,
  decodeHeader,
  transferFromEscrow,
  ESCROW_WALLET,
} from '../utils/stacks';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Multer for accepting file uploads on the gateway execute endpoint
const gatewayUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const PLATFORM_WALLET = ESCROW_WALLET;
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10');
const UPSTREAM_TIMEOUT = parseInt(process.env.UPSTREAM_TIMEOUT_MS || '15000', 10);

/**
 * GET /gateway/:apiId/invoice
 * Returns payment instructions for an API call.
 */
router.get('/:apiId/invoice', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiId = req.params.apiId as string;
    const api = await prisma.apiService.findUnique({
      where: { id: apiId },
    });

    if (!api) {
      return res.status(404).json({ error: 'API service not found' });
    }

    if (api.status !== 'active') {
      return res.status(403).json({
        error: 'API not available',
        message: `This API is currently ${api.status}`,
      });
    }

    res.json({
      apiId: api.id,
      apiName: api.name,
      price: api.pricePerReq,
      currency: 'STX',
      recipient: PLATFORM_WALLET,
      memo: `ax:${api.id.replace(/-/g, '').slice(0, 16)}`,
      method: api.method,
      inputType: api.inputType,
      message: 'Send exactly this amount of STX to the AXIOM escrow wallet. After successful API delivery, 90% is forwarded to the developer. If the request fails, you receive a full refund.',
      exampleTx: {
        to: PLATFORM_WALLET,
        amount: api.pricePerReq,
        memo: `ax:${api.id.replace(/-/g, '').slice(0, 16)}`,
        asset: 'STX',
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /gateway/:apiId/execute
 * The core 402-enforcing gateway endpoint.
 * 
 * Request body:
 *   - payload: any (JSON body or text to send upstream)
 *   - headers: Record<string, string> (optional extra headers)
 *   - paymentProof: string (tx hash, optional)
 * 
 * Flow:
 *   1. Validate API exists and is active
 *   2. Log the call attempt
 *   3. If no paymentProof -> return 402 Payment Required
 *   4. If paymentProof provided:
 *      a. Check if tx hash already used -> 403
 *      b. Verify tx (stub for MVP)
 *      c. Record transaction in DB
 *      d. Mark tx hash as used
 *      e. Proxy request to upstream URL
 *      f. Return upstream response
 */
router.post('/:apiId/execute', gatewayUpload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiId = req.params.apiId as string;
    // Support both JSON body and multipart form data
    const payload = req.body?.payload || req.body || {};
    const extraHeaders = req.body?.headers;
    const paymentProof = req.body?.paymentProof;
    const uploadedFile = (req as any).file as Express.Multer.File | undefined;
    const callerWallet = req.headers['x-wallet-address'] as string || 'anonymous';
    const startTime = Date.now();

    // 1. Find the API
    const api = await prisma.apiService.findUnique({
      where: { id: apiId },
    });

    if (!api) {
      return res.status(404).json({ error: 'API service not found' });
    }

    if (api.status !== 'active') {
      return res.status(403).json({
        error: 'API not available',
        message: `This API is currently ${api.status}`,
      });
    }

    // 2. If no payment proof -> return 402 with x402 headers
    const paymentSignature = req.headers['payment-signature'] as string | undefined;

    if (!paymentSignature && !paymentProof) {
      // Log the attempt
      await prisma.callLog.create({
        data: {
          apiId,
          callerWallet,
          requestMethod: api.method,
          responseCode: 402,
          latencyMs: Date.now() - startTime,
          paid: false,
        },
      });

      // Increment total calls
      await prisma.apiService.update({
        where: { id: apiId },
        data: { totalCalls: { increment: 1 } },
      });

      // Build x402 V2 payment-required header
      const paymentRequired = buildPaymentRequiredHeader(
        api.pricePerReq,
        PLATFORM_WALLET,
        `/gateway/${apiId}/execute`,
        `Pay-per-request: ${api.name} (Escrow)`
      );
      res.setHeader('payment-required', encodeHeader(paymentRequired));

      return res.status(402).json({
        error: 'Payment Required',
        x402Version: 2,
        apiId: api.id,
        apiName: api.name,
        price: api.pricePerReq,
        currency: 'STX',
        recipient: PLATFORM_WALLET,
        network: 'stacks:2147483648',
        message: 'x402 Payment Required. Payment is held in escrow. 90% goes to the developer on success; full refund on failure.',
        invoiceEndpoint: `/gateway/${apiId}/invoice`,
      });
    }

    // ─── Payment resolution: x402 header OR broadcast tx hash ───
    let resolvedTxHash: string;
    let resolvedPayer: string | undefined = callerWallet !== 'anonymous' ? callerWallet : undefined;

    if (paymentSignature) {
      // ── x402 programmatic flow: signed-but-not-broadcast tx ──
      const decoded = decodeHeader(paymentSignature) as any;
      const signedTxHex = decoded?.payload?.transaction;

      if (!signedTxHex) {
        return res.status(400).json({
          error: 'Invalid payment-signature header',
          message: 'Could not extract signed transaction from payment-signature.',
        });
      }

      const paymentReqs = buildPaymentRequirements(api.pricePerReq, PLATFORM_WALLET);
      const settlement = await settleTxViaFacilitator(signedTxHex, paymentReqs);

      if (!settlement.success) {
        await prisma.callLog.create({
          data: {
            apiId,
            callerWallet,
            requestMethod: api.method,
            responseCode: 402,
            latencyMs: Date.now() - startTime,
            paid: false,
          },
        });

        return res.status(402).json({
          error: 'Payment settlement failed',
          message: settlement.error || 'Facilitator could not settle the transaction.',
        });
      }

      resolvedTxHash = settlement.transaction!;
      resolvedPayer = settlement.payer || resolvedPayer;
    } else {
      // ── Browser wallet flow: tx already broadcast, verify on-chain ──
      resolvedTxHash = paymentProof;
    }

    // 3. Check if payment proof already used
    const existingProof = await prisma.usedPaymentProof.findUnique({
      where: { txHash: resolvedTxHash },
    });

    if (existingProof) {
      await prisma.callLog.create({
        data: {
          apiId,
          callerWallet,
          requestMethod: api.method,
          responseCode: 403,
          latencyMs: Date.now() - startTime,
          paid: false,
          txHash: resolvedTxHash,
        },
      });

      return res.status(403).json({
        error: 'Payment proof already used',
        message: 'Each transaction hash can only be used once. Please make a new payment.',
      });
    }

    // 4. Verify the transaction (skip for x402 facilitator path — already settled)
    if (!paymentSignature) {
      const verification = await verifyStacksTx(resolvedTxHash, api.pricePerReq, PLATFORM_WALLET);
      if (!verification.valid) {
        await prisma.callLog.create({
          data: {
            apiId,
            callerWallet,
            requestMethod: api.method,
            responseCode: 402,
            latencyMs: Date.now() - startTime,
            paid: false,
            txHash: resolvedTxHash,
          },
        });

        return res.status(402).json({
          error: 'Invalid payment proof',
          message: verification.message,
        });
      }
      resolvedPayer = verification.payer || resolvedPayer;
    }

    // 5. Mark tx hash as used
    await prisma.usedPaymentProof.create({
      data: { txHash: resolvedTxHash, apiId },
    });

    // 6. Calculate fees and record transaction
    const platformFee = parseFloat((api.pricePerReq * (PLATFORM_FEE_PERCENT / 100)).toFixed(6));
    const providerEarning = parseFloat((api.pricePerReq - platformFee).toFixed(6));

    // Record transaction as 'escrowed' — funds are in the platform wallet
    const txRecord = await prisma.transaction.create({
      data: {
        apiId,
        apiName: api.name,
        payerWallet: resolvedPayer || callerWallet,
        providerWallet: api.providerWallet,
        amountPaid: api.pricePerReq,
        platformFee,
        providerEarning,
        txHash: resolvedTxHash,
        status: 'escrowed',
        responseCode: 200,
      },
    });

    // 7. Proxy request to upstream API
    let upstreamResponse: any;
    let upstreamStatus = 200;
    let latencyMs = 0;
    let upstreamFailed = false;

    try {
      const proxyHeaders: Record<string, string> = {
        ...(extraHeaders || {}),
      };

      // Inject developer's auth header if configured
      if (api.authHeader) {
        proxyHeaders['Authorization'] = api.authHeader;
      }

      const proxyStart = Date.now();

      // If a file was uploaded and the API expects file input, forward as multipart/form-data
      if (uploadedFile && (api.inputType === 'pdf' || api.inputType === 'form')) {
        const form = new FormData();
        form.append('file', uploadedFile.buffer, {
          filename: uploadedFile.originalname,
          contentType: uploadedFile.mimetype,
        });

        // Append any extra text fields from payload
        if (typeof payload === 'object' && payload !== null) {
          for (const [key, val] of Object.entries(payload)) {
            if (key !== 'paymentProof' && key !== 'file' && val !== undefined && val !== null) {
              form.append(key, String(val));
            }
          }
        }

        const upstreamRes = await axios.post(api.upstreamUrl, form, {
          headers: {
            ...proxyHeaders,
            ...form.getHeaders(),
          },
          timeout: UPSTREAM_TIMEOUT,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });
        upstreamResponse = upstreamRes.data;
        upstreamStatus = upstreamRes.status;
      } else if (api.method === 'GET') {
        proxyHeaders['Content-Type'] = 'application/json';
        const upstreamRes = await axios.get(api.upstreamUrl, {
          headers: proxyHeaders,
          timeout: UPSTREAM_TIMEOUT,
          params: payload,
        });
        upstreamResponse = upstreamRes.data;
        upstreamStatus = upstreamRes.status;
      } else {
        proxyHeaders['Content-Type'] = 'application/json';
        const upstreamRes = await axios.post(api.upstreamUrl, payload, {
          headers: proxyHeaders,
          timeout: UPSTREAM_TIMEOUT,
        });
        upstreamResponse = upstreamRes.data;
        upstreamStatus = upstreamRes.status;
      }

      latencyMs = Date.now() - proxyStart;
    } catch (proxyErr: any) {
      latencyMs = Date.now() - startTime;
      upstreamStatus = proxyErr.response?.status || 502;
      upstreamFailed = true;
      upstreamResponse = {
        error: 'Upstream API error',
        message: proxyErr.message,
        upstreamStatus,
      };
    }

    // ─── REFUND: If upstream failed, refund the payment from escrow ───
    if (upstreamFailed) {
      // Initiate on-chain refund from escrow wallet back to user
      const refundRecipient = resolvedPayer || callerWallet;
      let refundTxId: string | undefined;
      if (refundRecipient && refundRecipient !== 'anonymous') {
        const refundResult = await transferFromEscrow(
          refundRecipient,
          api.pricePerReq,
          `ax:ref:${(apiId as string).replace(/-/g, '').slice(0, 12)}`
        );
        refundTxId = refundResult.txId;
        if (!refundResult.success) {
          console.warn(`[Escrow] Refund transfer failed for ${resolvedTxHash}: ${refundResult.error}`);
        }
      }

      // Mark transaction as refunded
      await prisma.transaction.updateMany({
        where: { txHash: resolvedTxHash },
        data: {
          status: 'refunded',
          responseCode: upstreamStatus,
          payoutTxHash: refundTxId || null,
        },
      });

      // Remove used payment proof so the tx hash can be reused for a retry
      await prisma.usedPaymentProof.deleteMany({
        where: { txHash: resolvedTxHash },
      });

      // Log the failed call
      await prisma.callLog.create({
        data: {
          apiId,
          callerWallet,
          requestMethod: api.method,
          responseCode: upstreamStatus,
          latencyMs,
          paid: true,
          txHash: resolvedTxHash,
        },
      });

      // Update API stats (count the call but not as success)
      await prisma.apiService.update({
        where: { id: apiId },
        data: { totalCalls: { increment: 1 } },
      });

      return res.status(502).json({
        status: 'refunded',
        error: 'Upstream API failed — payment refunded',
        message: `The upstream service returned an error (HTTP ${upstreamStatus}). A refund of ${api.pricePerReq} STX has been initiated back to your wallet.`,
        refund: {
          txHash: resolvedTxHash,
          refundTxHash: refundTxId || 'pending',
          amount: api.pricePerReq,
          currency: 'STX',
          recipient: refundRecipient,
          reason: upstreamResponse?.message || 'Upstream service unavailable',
        },
        apiId: api.id,
        apiName: api.name,
        latency: `${latencyMs}ms`,
      });
    }

    // 8. Escrow settlement: transfer 90% to developer (10% commission stays in escrow)
    let payoutTxId: string | undefined;
    const payoutResult = await transferFromEscrow(
      api.providerWallet,
      providerEarning,
      `ax:pay:${(apiId as string).replace(/-/g, '').slice(0, 12)}`
    );
    payoutTxId = payoutResult.txId;
    if (!payoutResult.success) {
      console.warn(`[Escrow] Payout transfer failed for ${resolvedTxHash}: ${payoutResult.error}`);
    }

    // Update transaction status to settled with payout info
    await prisma.transaction.updateMany({
      where: { txHash: resolvedTxHash },
      data: {
        status: payoutResult.success ? 'settled' : 'payout_pending',
        payoutTxHash: payoutTxId || null,
      },
    });

    // 9. Log successful call
    await prisma.callLog.create({
      data: {
        apiId,
        callerWallet,
        requestMethod: api.method,
        responseCode: upstreamStatus,
        latencyMs,
        paid: true,
        txHash: resolvedTxHash,
      },
    });

    // 10. Update API stats
    await prisma.apiService.update({
      where: { id: apiId },
      data: {
        totalCalls: { increment: 1 },
        successCalls: upstreamStatus >= 200 && upstreamStatus < 400 ? { increment: 1 } : undefined,
      },
    });

    // 11. Set x402 payment-response header and return result
    const paymentRes = buildPaymentResponse(resolvedTxHash, resolvedPayer || callerWallet);
    res.setHeader('payment-response', encodeHeader(paymentRes));

    res.status(upstreamStatus >= 200 && upstreamStatus < 400 ? 200 : upstreamStatus).json({
      status: 'success',
      data: upstreamResponse,
      tx_hash: resolvedTxHash,
      payout_tx_hash: payoutTxId || null,
      cost: `${api.pricePerReq} STX`,
      commission: `${platformFee} STX (${PLATFORM_FEE_PERCENT}%)`,
      developer_earning: `${providerEarning} STX`,
      latency: `${latencyMs}ms`,
      apiId: api.id,
      apiName: api.name,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
