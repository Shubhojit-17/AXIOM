import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client';
import { formatTransactionForFrontend } from '../utils/formatters';

const router = Router();

/**
 * GET /api/transactions
 * List transactions. Optional query: ?wallet=<address>
 * Returns transactions formatted to match MOCK_TRANSACTIONS shape.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = req.query;

    const where: any = {};
    if (wallet) {
      where.payerWallet = wallet as string;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json(transactions.map(formatTransactionForFrontend));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/transactions
 * Create a transaction record manually (admin/internal use).
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tx = await prisma.transaction.create({
      data: req.body,
    });

    res.status(201).json(formatTransactionForFrontend(tx));
  } catch (err) {
    next(err);
  }
});

export default router;
