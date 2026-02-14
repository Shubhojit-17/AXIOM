import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client';
import { CreateServiceSchema, UpdateServiceSchema, UpdateStatusSchema } from '../utils/validators';
import { formatApiForFrontend } from '../utils/formatters';
import { requireWallet } from '../middleware/auth';

const router = Router();

/**
 * GET /api/services
 * List all published API services (marketplace).
 * Optional query params: ?category=AI/ML&search=summarizer&status=active
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, status } = req.query;

    const where: any = {};

    // Default: only show active services in marketplace
    if (status) {
      where.status = status as string;
    } else {
      where.status = 'active';
    }

    if (category && category !== 'All') {
      where.category = category as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const services = await prisma.apiService.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(services.map(formatApiForFrontend));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/services/:id
 * Get a single API service by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const service = await prisma.apiService.findUnique({
      where: { id },
    });

    if (!service) {
      return res.status(404).json({ error: 'API service not found' });
    }

    res.json(formatApiForFrontend(service));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/services
 * Create a new API service (developer). Requires wallet.
 */
router.post('/', requireWallet, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateServiceSchema.parse(req.body);
    const wallet = (req as any).walletAddress;

    const service = await prisma.apiService.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: JSON.stringify(data.tags),
        upstreamUrl: data.upstreamUrl,
        method: data.method,
        pricePerReq: data.pricePerReq,
        provider: wallet.slice(0, 4) + '...' + wallet.slice(-2),
        providerWallet: data.providerWallet || wallet,
        providerName: data.providerName,
        status: data.status,
        inputType: data.inputType,
        inputSchema: data.inputSchema ? JSON.stringify(data.inputSchema) : null,
        authHeader: data.authHeader,
        endpoint: '', // will be set after creation
      },
    });

    // Set the gateway endpoint using the generated id
    const updated = await prisma.apiService.update({
      where: { id: service.id },
      data: { endpoint: `/gateway/${service.id}/execute` },
    });

    res.status(201).json(formatApiForFrontend(updated));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/services/:id
 * Update an API service
 */
router.put('/:id', requireWallet, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = UpdateServiceSchema.parse(req.body);
    const wallet = (req as any).walletAddress;

    // Verify ownership
    const existing = await prisma.apiService.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'API service not found' });
    if (existing.providerWallet !== wallet) {
      return res.status(403).json({ error: 'Not authorized to update this service' });
    }

    const updateData: any = { ...data };
    if (data.tags) updateData.tags = JSON.stringify(data.tags);
    if (data.inputSchema) updateData.inputSchema = JSON.stringify(data.inputSchema);

    const updated = await prisma.apiService.update({
      where: { id },
      data: updateData,
    });

    res.json(formatApiForFrontend(updated));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/services/:id
 * Delete an API service
 */
router.delete('/:id', requireWallet, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const wallet = (req as any).walletAddress;
    const existing = await prisma.apiService.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'API service not found' });
    if (existing.providerWallet !== wallet) {
      return res.status(403).json({ error: 'Not authorized to delete this service' });
    }

    // Delete related records first to avoid foreign key constraint violations
    const serviceId = id;
    await prisma.callLog.deleteMany({ where: { apiId: serviceId } });
    await prisma.transaction.deleteMany({ where: { apiId: serviceId } });
    await prisma.usedPaymentProof.deleteMany({ where: { apiId: serviceId } });
    await prisma.apiService.delete({ where: { id: serviceId } });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/services/:id/status
 * Update API service status (publish/unpublish/pause)
 */
router.patch('/:id/status', requireWallet, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = UpdateStatusSchema.parse(req.body);
    const wallet = (req as any).walletAddress;

    const existing = await prisma.apiService.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'API service not found' });
    if (existing.providerWallet !== wallet) {
      return res.status(403).json({ error: 'Not authorized to update this service' });
    }

    const updated = await prisma.apiService.update({
      where: { id },
      data: { status },
    });

    res.json(formatApiForFrontend(updated));
  } catch (err) {
    next(err);
  }
});

export default router;
