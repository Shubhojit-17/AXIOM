import { z } from 'zod';

// --- Services ---

export const CreateServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  upstreamUrl: z.string().url(),
  method: z.enum(['GET', 'POST']).default('POST'),
  pricePerReq: z.number().positive(),
  providerWallet: z.string().min(1),
  providerName: z.string().optional(),
  status: z.enum(['active', 'paused', 'draft']).default('draft'),
  inputType: z.enum(['text', 'pdf', 'json', 'form']).default('json'),
  inputSchema: z.any().optional(),
  authHeader: z.string().optional(),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export const UpdateStatusSchema = z.object({
  status: z.enum(['active', 'paused', 'draft']),
});

// --- Gateway ---

export const ExecuteRequestSchema = z.object({
  payload: z.any().optional(),
  headers: z.record(z.string()).optional(),
  paymentProof: z.string().optional(),
});

// --- Transactions ---

export const CreateTransactionSchema = z.object({
  apiId: z.string(),
  apiName: z.string(),
  payerWallet: z.string(),
  providerWallet: z.string(),
  amountPaid: z.number(),
  platformFee: z.number(),
  providerEarning: z.number(),
  txHash: z.string(),
  status: z.enum(['confirmed', 'pending', 'failed']).default('pending'),
  responseCode: z.number().optional(),
});
