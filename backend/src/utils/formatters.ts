/**
 * Format an ApiService from DB row to the shape the frontend expects.
 * Matches the `ApiService` interface in frontend/src/data/mockData.ts
 */
export function formatApiForFrontend(api: any) {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    category: api.category,
    pricePerReq: api.pricePerReq,
    provider: api.provider,
    providerWallet: api.providerWallet,
    providerName: api.providerName,
    uptime: api.uptime,
    totalCalls: api.totalCalls,
    latency: api.latency,
    tags: typeof api.tags === 'string' ? JSON.parse(api.tags) : api.tags,
    endpoint: api.endpoint,
    upstreamUrl: api.upstreamUrl,
    method: api.method,
    status: api.status,
    inputType: api.inputType,
    inputSchema: api.inputSchema ? (typeof api.inputSchema === 'string' ? JSON.parse(api.inputSchema) : api.inputSchema) : null,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    stats: {
      totalCalls: api.totalCalls,
      successRate: api.totalCalls > 0 ? ((api.successCalls / api.totalCalls) * 100).toFixed(1) : '100.0',
      avgLatency: api.latency,
    },
  };
}

/**
 * Format a Transaction from DB to the shape the frontend TransactionsPage expects.
 * Matches the `Transaction` interface in frontend/src/data/mockData.ts
 */
export function formatTransactionForFrontend(tx: any) {
  const now = new Date();
  const txTime = new Date(tx.timestamp);
  const diffMs = now.getTime() - txTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  let timeAgo: string;
  if (diffMins < 1) timeAgo = 'just now';
  else if (diffMins < 60) timeAgo = `${diffMins} mins ago`;
  else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)} hours ago`;
  else timeAgo = `${Math.floor(diffMins / 1440)} days ago`;

  return {
    id: tx.id,
    apiId: tx.apiId,
    apiName: tx.apiName,
    amount: tx.amountPaid,
    hash: tx.txHash.slice(0, 4) + '...' + tx.txHash.slice(-3),
    fullHash: tx.txHash,
    timestamp: timeAgo,
    rawTimestamp: tx.timestamp,
    status: tx.status,
    payerWallet: tx.payerWallet,
    providerWallet: tx.providerWallet,
    platformFee: tx.platformFee,
    providerEarning: tx.providerEarning,
    responseCode: tx.responseCode,
  };
}
