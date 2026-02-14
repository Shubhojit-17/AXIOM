// ---- API Service ----
export interface ApiService {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePerReq: number;
  provider: string;
  providerWallet: string;
  providerName: string | null;
  uptime: number;
  totalCalls: number;
  latency: number;
  tags: string[];
  endpoint: string;
  upstreamUrl: string;
  method: string;
  status: string;
  inputType: string;
  inputSchema: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalCalls: number;
    successRate: string;
    avgLatency: number;
  };
}

// ---- Transaction ----
export interface Transaction {
  id: string;
  apiId: string;
  apiName: string;
  amount: number;
  hash: string;
  fullHash: string;
  timestamp: string;
  rawTimestamp: string;
  status: string;
  payerWallet: string;
  providerWallet: string;
  platformFee: number;
  providerEarning: number;
  responseCode: number | null;
}

// ---- Developer Stats ----
export interface DeveloperStats {
  totalRevenue: number;
  totalCalls: number;
  activeUsers: number;
  avgLatency: number;
  conversionRate: number;
  serviceCount: number;
}

// ---- Earnings Data ----
export interface EarningsDataPoint {
  name: string;
  stx: number;
}

// ---- Invoice ----
export interface Invoice {
  apiId: string;
  apiName: string;
  price: number;
  currency: string;
  recipient: string;
  memo: string;
  method: string;
  inputType: string;
  message: string;
  exampleTx: {
    to: string;
    amount: number;
    memo: string;
    asset: string;
  };
}

// ---- Gateway Execute Response ----
export interface GatewayExecuteResponse {
  status: string;
  data: unknown;
  tx_hash: string;
  cost: string;
  latency: string;
  apiId: string;
  apiName: string;
}

// ---- Gateway 402 Response ----
export interface Gateway402Response {
  error: string;
  apiId: string;
  apiName: string;
  price: number;
  currency: string;
  recipient: string;
  message: string;
  invoiceEndpoint: string;
  x402Version?: number;
  network?: string;
}

// ---- x402 V2 Payment Requirement ----
export interface X402PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: unknown;
}

export interface X402PaymentRequired {
  x402Version: number;
  paymentRequirements: X402PaymentRequirement[];
}

export interface X402PaymentResponse {
  success: boolean;
  transaction: string;
  payer: string;
  network: string;
}

// ---- Create Service Payload ----
export interface CreateServicePayload {
  name: string;
  description: string;
  category: string;
  tags: string[];
  upstreamUrl: string;
  method: 'GET' | 'POST';
  pricePerReq: number;
  providerWallet: string;
  providerName?: string;
  status: 'active' | 'paused' | 'draft';
  inputType: 'text' | 'pdf' | 'json' | 'form' | 'none';
  inputSchema?: Record<string, unknown>;
  authHeader?: string;
}
