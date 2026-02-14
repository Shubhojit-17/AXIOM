import type {
  ApiService,
  Transaction,
  DeveloperStats,
  EarningsDataPoint,
  Invoice,
  GatewayExecuteResponse,
  Gateway402Response,
  CreateServicePayload,
} from './types';

const BASE = '';

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
    const err = new Error('Payment Required') as any;
    err.status = 402;
    err.data = body as Gateway402Response;
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
