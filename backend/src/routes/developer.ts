import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client';
import { formatApiForFrontend, formatTransactionForFrontend } from '../utils/formatters';

const router = Router();

/**
 * GET /api/developer/stats?wallet=<address>
 * Return developer dashboard aggregate stats.
 * Replaces the hardcoded stats in DeveloperDashboard.tsx
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = (req.query.wallet as string) || (req as any).walletAddress;
    if (!wallet) {
      return res.status(400).json({ error: 'wallet parameter required' });
    }

    // Get all transactions where this developer is the provider
    const transactions = await prisma.transaction.findMany({
      where: { providerWallet: wallet },
    });

    const successStatuses = ['confirmed', 'escrowed', 'settled', 'payout_pending'];
    const confirmedTx = transactions.filter(t => successStatuses.includes(t.status));
    const totalEarned = confirmedTx.reduce((sum, t) => sum + t.providerEarning, 0);
    const totalCalls = transactions.length;

    // Get developer's services
    const services = await prisma.apiService.findMany({
      where: { providerWallet: wallet },
    });

    const totalServiceCalls = services.reduce((sum, s) => sum + s.totalCalls, 0);
    const avgLatency = services.length > 0
      ? Math.round(services.reduce((sum, s) => sum + s.latency, 0) / services.length)
      : 0;

    // Call logs for conversion rate
    const callLogs = await prisma.callLog.findMany({
      where: {
        apiId: { in: services.map(s => s.id) },
      },
    });

    const totalAttempts = callLogs.length || totalServiceCalls || 1;
    const paidAttempts = callLogs.filter(l => l.paid).length || confirmedTx.length;
    const conversionRate = ((paidAttempts / totalAttempts) * 100).toFixed(1);

    // Active users (unique payer wallets)
    const uniquePayersSet = new Set(transactions.map(t => t.payerWallet));

    res.json({
      totalRevenue: parseFloat(totalEarned.toFixed(4)),
      totalCalls: totalServiceCalls,
      activeUsers: uniquePayersSet.size,
      avgLatency,
      conversionRate: parseFloat(conversionRate),
      serviceCount: services.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/developer/earnings?wallet=<address>&period=7d|30d|90d
 * Return earnings chart data.
 * Replaces MOCK_EARNINGS_DATA in DeveloperDashboard.tsx
 */
router.get('/earnings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = (req.query.wallet as string) || (req as any).walletAddress;
    const period = (req.query.period as string) || '7d';

    if (!wallet) {
      return res.status(400).json({ error: 'wallet parameter required' });
    }

    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.transaction.findMany({
      where: {
        providerWallet: wallet,
        status: { in: ['confirmed', 'escrowed', 'settled', 'payout_pending'] },
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group by day
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const grouped: Record<string, number> = {};

    // Initialize all days in range
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = days <= 7
        ? dayLabels[d.getDay()]
        : `${d.getMonth() + 1}/${d.getDate()}`;
      grouped[key] = grouped[key] || 0;
    }

    // Sum earnings per day
    for (const tx of transactions) {
      const d = new Date(tx.timestamp);
      const key = days <= 7
        ? dayLabels[d.getDay()]
        : `${d.getMonth() + 1}/${d.getDate()}`;
      grouped[key] = (grouped[key] || 0) + tx.providerEarning;
    }

    const earningsData = Object.entries(grouped).map(([name, stx]) => ({
      name,
      stx: parseFloat(stx.toFixed(4)),
    }));

    res.json(earningsData);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/developer/services?wallet=<address>
 * Return developer's own API services.
 */
router.get('/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = (req.query.wallet as string) || (req as any).walletAddress;
    if (!wallet) {
      return res.status(400).json({ error: 'wallet parameter required' });
    }

    const services = await prisma.apiService.findMany({
      where: { providerWallet: wallet },
      orderBy: { createdAt: 'desc' },
    });

    res.json(services.map(formatApiForFrontend));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/developer/feed?wallet=<address>
 * Return recent payments feed for the developer.
 * Powers the "Live Feed" section in DeveloperDashboard.
 */
router.get('/feed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = (req.query.wallet as string) || (req as any).walletAddress;
    if (!wallet) {
      return res.status(400).json({ error: 'wallet parameter required' });
    }

    const recentTx = await prisma.transaction.findMany({
      where: {
        providerWallet: wallet,
        status: { in: ['confirmed', 'escrowed', 'settled', 'payout_pending'] },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    res.json(recentTx.map(formatTransactionForFrontend));
  } catch (err) {
    next(err);
  }
});

export default router;
