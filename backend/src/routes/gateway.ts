import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import prisma from '../db/client';
import { verifyStacksTx } from '../utils/stacks';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const PLATFORM_WALLET = process.env.PLATFORM_WALLET || 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS';
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10');
const UPSTREAM_TIMEOUT = parseInt(process.env.UPSTREAM_TIMEOUT_MS || '15000', 10);

/**
 * GET /gateway/:apiId/invoice
 * Returns payment instructions for an API call.
 */
router.get('/:apiId/invoice', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const api = await prisma.apiService.findUnique({
      where: { id: req.params.apiId },
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
      recipient: api.providerWallet,
      memo: `axiom:${api.id}:${Date.now()}`,
      method: api.method,
      inputType: api.inputType,
      message: 'Send exactly this amount of STX to the recipient address. Include the memo. Then retry with paymentProof set to your tx hash.',
      exampleTx: {
        to: api.providerWallet,
        amount: api.pricePerReq,
        memo: `axiom:${api.id}:${Date.now()}`,
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
router.post('/:apiId/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apiId } = req.params;
    const { payload, headers: extraHeaders, paymentProof } = req.body || {};
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

    // 2. If no payment proof -> return 402
    if (!paymentProof) {
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

      return res.status(402).json({
        error: 'Payment Required',
        apiId: api.id,
        apiName: api.name,
        price: api.pricePerReq,
        currency: 'STX',
        recipient: api.providerWallet,
        message: 'Pay-per-request enforced via HTTP 402. Provide paymentProof (tx hash) to proceed.',
        invoiceEndpoint: `/gateway/${apiId}/invoice`,
      });
    }

    // 3. Check if payment proof already used
    const existingProof = await prisma.usedPaymentProof.findUnique({
      where: { txHash: paymentProof },
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
          txHash: paymentProof,
        },
      });

      return res.status(403).json({
        error: 'Payment proof already used',
        message: 'Each transaction hash can only be used once. Please make a new payment.',
      });
    }

    // 4. Verify the transaction (stub for MVP)
    const verification = await verifyStacksTx(paymentProof, api.pricePerReq, api.providerWallet);
    if (!verification.valid) {
      await prisma.callLog.create({
        data: {
          apiId,
          callerWallet,
          requestMethod: api.method,
          responseCode: 402,
          latencyMs: Date.now() - startTime,
          paid: false,
          txHash: paymentProof,
        },
      });

      return res.status(402).json({
        error: 'Invalid payment proof',
        message: verification.message,
      });
    }

    // 5. Mark tx hash as used
    await prisma.usedPaymentProof.create({
      data: { txHash: paymentProof, apiId },
    });

    // 6. Calculate fees and record transaction
    const platformFee = parseFloat((api.pricePerReq * (PLATFORM_FEE_PERCENT / 100)).toFixed(6));
    const providerEarning = parseFloat((api.pricePerReq - platformFee).toFixed(6));

    await prisma.transaction.create({
      data: {
        apiId,
        apiName: api.name,
        payerWallet: callerWallet,
        providerWallet: api.providerWallet,
        amountPaid: api.pricePerReq,
        platformFee,
        providerEarning,
        txHash: paymentProof,
        status: 'confirmed',
        responseCode: 200,
      },
    });

    // 7. Proxy request to upstream API
    let upstreamResponse: any;
    let upstreamStatus = 200;
    let latencyMs = 0;

    try {
      const proxyHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(extraHeaders || {}),
      };

      // Inject developer's auth header if configured
      if (api.authHeader) {
        proxyHeaders['Authorization'] = api.authHeader;
      }

      const proxyStart = Date.now();

      if (api.method === 'GET') {
        const upstreamRes = await axios.get(api.upstreamUrl, {
          headers: proxyHeaders,
          timeout: UPSTREAM_TIMEOUT,
          params: payload,
        });
        upstreamResponse = upstreamRes.data;
        upstreamStatus = upstreamRes.status;
      } else {
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
      upstreamResponse = {
        error: 'Upstream API error',
        message: proxyErr.message,
        upstreamStatus,
      };
    }

    // 8. Log successful call
    await prisma.callLog.create({
      data: {
        apiId,
        callerWallet,
        requestMethod: api.method,
        responseCode: upstreamStatus,
        latencyMs,
        paid: true,
        txHash: paymentProof,
      },
    });

    // 9. Update API stats
    await prisma.apiService.update({
      where: { id: apiId },
      data: {
        totalCalls: { increment: 1 },
        successCalls: upstreamStatus >= 200 && upstreamStatus < 400 ? { increment: 1 } : undefined,
      },
    });

    // 10. Return response
    res.status(upstreamStatus >= 200 && upstreamStatus < 400 ? 200 : upstreamStatus).json({
      status: 'success',
      data: upstreamResponse,
      tx_hash: paymentProof,
      cost: `${api.pricePerReq} STX`,
      latency: `${latencyMs}ms`,
      apiId: api.id,
      apiName: api.name,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
