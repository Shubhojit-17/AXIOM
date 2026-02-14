import type {
  ApiService,
  Transaction,
  DeveloperStats,
  EarningsDataPoint,
  Invoice,
  GatewayExecuteResponse,
  Gateway402Response,
  X402PaymentRequired,
  CreateServicePayload,
} from './types';

const BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const wallet = localStorage.getItem('axiom_wallet') || '';
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-wallet-address': wallet,
      ...(options?.headers || {}),
    },
  });

  if (res.status === 402) {
    const body = await res.json();

    // Parse x402 payment-required header
    const paymentRequiredHeader = res.headers.get('payment-required');
    let x402: X402PaymentRequired | null = null;
    if (paymentRequiredHeader) {
      try {
        x402 = JSON.parse(atob(paymentRequiredHeader));
      } catch {
        // Fall back to body-only data
      }
    }

    const err = new Error('Payment Required') as any;
    err.status = 402;
    err.data = body as Gateway402Response;
    err.x402 = x402;
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(body.error || body.message || res.statusText) as any;
    err.status = res.status;
    err.data = body;
    throw err;
  }

  return res.json();
}

// ---- Services (Marketplace) ----

export async function getServices(params?: {
  category?: string;
  search?: string;
  status?: string;
}): Promise<ApiService[]> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'All') qs.set('category', params.category);
  if (params?.search) qs.set('search', params.search);
  if (params?.status) qs.set('status', params.status);
  const query = qs.toString();
  return request<ApiService[]>(`${BASE}/api/services${query ? `?${query}` : ''}`);
}

export async function getService(id: string): Promise<ApiService> {
  return request<ApiService>(`${BASE}/api/services/${id}`);
}

export async function createService(data: CreateServicePayload): Promise<ApiService> {
  return request<ApiService>(`${BASE}/api/services`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateService(id: string, data: Partial<CreateServicePayload>): Promise<ApiService> {
  return request<ApiService>(`${BASE}/api/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteService(id: string): Promise<void> {
  await request<{ message: string }>(`${BASE}/api/services/${id}`, {
    method: 'DELETE',
  });
}

export async function updateServiceStatus(
  id: string,
  status: 'active' | 'paused' | 'draft'
): Promise<ApiService> {
  return request<ApiService>(`${BASE}/api/services/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ---- Transactions ----

export async function getTransactions(wallet?: string): Promise<Transaction[]> {
  const qs = wallet ? `?wallet=${encodeURIComponent(wallet)}` : '';
  return request<Transaction[]>(`${BASE}/api/transactions${qs}`);
}

// ---- Developer ----

export async function getDeveloperStats(wallet: string): Promise<DeveloperStats> {
  return request<DeveloperStats>(`${BASE}/api/developer/stats?wallet=${encodeURIComponent(wallet)}`);
}

export async function getDeveloperEarnings(
  wallet: string,
  period: '7d' | '30d' | '90d' = '7d'
): Promise<EarningsDataPoint[]> {
  return request<EarningsDataPoint[]>(
    `${BASE}/api/developer/earnings?wallet=${encodeURIComponent(wallet)}&period=${period}`
  );
}

export async function getDeveloperServices(wallet: string): Promise<ApiService[]> {
  return request<ApiService[]>(`${BASE}/api/developer/services?wallet=${encodeURIComponent(wallet)}`);
}

export async function getDeveloperFeed(wallet: string): Promise<Transaction[]> {
  return request<Transaction[]>(`${BASE}/api/developer/feed?wallet=${encodeURIComponent(wallet)}`);
}

// ---- Gateway ----

export async function getInvoice(apiId: string): Promise<Invoice> {
  return request<Invoice>(`${BASE}/gateway/${apiId}/invoice`);
}

export async function executeGateway(
  apiId: string,
  payload: unknown,
  paymentProof?: string,
  headers?: Record<string, string>
): Promise<GatewayExecuteResponse> {
  return request<GatewayExecuteResponse>(`${BASE}/gateway/${apiId}/execute`, {
    method: 'POST',
    body: JSON.stringify({ payload, paymentProof, headers }),
  });
}

/**
 * Execute a gateway call with a file upload (e.g. PDF).
 * Sends as multipart/form-data so the gateway can forward to upstream.
 */
export async function executeGatewayWithFile(
  apiId: string,
  file: File,
  paymentProof?: string,
  extraPayload?: Record<string, string>
): Promise<GatewayExecuteResponse> {
  const wallet = localStorage.getItem('axiom_wallet') || '';
  const formData = new FormData();
  formData.append('file', file);
  if (paymentProof) formData.append('paymentProof', paymentProof);
  if (extraPayload) {
    Object.entries(extraPayload).forEach(([k, v]) => formData.append(k, v));
  }

  const res = await fetch(`${BASE}/gateway/${apiId}/execute`, {
    method: 'POST',
    headers: {
      'x-wallet-address': wallet,
      // Do NOT set Content-Type — browser sets it with boundary for FormData
    },
    body: formData,
  });

  if (res.status === 402) {
    const body = await res.json();
    const paymentRequiredHeader = res.headers.get('payment-required');
    let x402: X402PaymentRequired | null = null;
    if (paymentRequiredHeader) {
      try { x402 = JSON.parse(atob(paymentRequiredHeader)); } catch {}
    }
    const err = new Error('Payment Required') as any;
    err.status = 402;
    err.data = body as Gateway402Response;
    err.x402 = x402;
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(body.error || body.message || res.statusText) as any;
    err.status = res.status;
    err.data = body;
    throw err;
  }

  return res.json();
}

// ---- x402: Poll Stacks API for a matching recent transaction ----
const STACKS_API = 'https://api.testnet.hiro.so';

export async function pollForMatchingTx(
  senderAddress: string,
  recipientAddress: string,
  minAmountMicroSTX: number,
  afterTimestamp: number
): Promise<string | null> {
  try {
    // Check mempool for pending transactions
    const mempoolRes = await fetch(
      `${STACKS_API}/extended/v1/address/${senderAddress}/mempool?limit=10`
    );
    if (mempoolRes.ok) {
      const mempoolData = await mempoolRes.json();
      for (const tx of mempoolData.results || []) {
        if (
          tx.tx_type === 'token_transfer' &&
          tx.token_transfer?.recipient_address === recipientAddress &&
          parseInt(tx.token_transfer?.amount || '0', 10) >= minAmountMicroSTX
        ) {
          const txTime = new Date(tx.receipt_time_iso || tx.receipt_time * 1000).getTime();
          if (txTime >= afterTimestamp - 30000) {
            return tx.tx_id;
          }
        }
      }
    }

    // Check confirmed transactions
    const txRes = await fetch(
      `${STACKS_API}/extended/v1/address/${senderAddress}/transactions?limit=5`
    );
    if (txRes.ok) {
      const txData = await txRes.json();
      for (const tx of txData.results || []) {
        if (
          tx.tx_type === 'token_transfer' &&
          tx.token_transfer?.recipient_address === recipientAddress &&
          parseInt(tx.token_transfer?.amount || '0', 10) >= minAmountMicroSTX
        ) {
          const txTime = (tx.burn_block_time || tx.receipt_time || 0) * 1000;
          if (txTime >= afterTimestamp - 30000) {
            return tx.tx_id;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
