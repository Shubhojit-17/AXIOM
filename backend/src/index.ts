import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { walletAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import servicesRouter from './routes/services';
import transactionsRouter from './routes/transactions';
import developerRouter from './routes/developer';
import gatewayRouter from './routes/gateway';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// --- Global Middleware ---
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['payment-required', 'payment-response'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(walletAuth);

// --- Health Check ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'axiom-backend', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/services', servicesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/developer', developerRouter);
app.use('/gateway', gatewayRouter);

// --- Error Handler ---
app.use(errorHandler);

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║         🔥 AXIOM Backend Running 🔥           ║
  ║                                               ║
  ║   HTTP:  http://localhost:${PORT}               ║
  ║   Mode:  ${process.env.NODE_ENV || 'development'}                    ║
  ║                                               ║
  ║   Routes:                                     ║
  ║     GET  /health                              ║
  ║     GET  /api/services                        ║
  ║     GET  /api/services/:id                    ║
  ║     POST /api/services                        ║
  ║     PUT  /api/services/:id                    ║
  ║     DEL  /api/services/:id                    ║
  ║     PATCH /api/services/:id/status            ║
  ║     GET  /api/transactions                    ║
  ║     GET  /api/developer/stats                 ║
  ║     GET  /api/developer/earnings              ║
  ║     GET  /api/developer/services              ║
  ║     GET  /api/developer/feed                  ║
  ║     GET  /gateway/:apiId/invoice              ║
  ║     POST /gateway/:apiId/execute              ║
  ╚═══════════════════════════════════════════════╝
  `);
});

export default app;
