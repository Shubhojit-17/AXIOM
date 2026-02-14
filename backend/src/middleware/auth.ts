import { Request, Response, NextFunction } from 'express';

/**
 * Extract wallet address from request headers.
 * For MVP: simple header-based auth (x-wallet-address).
 * In production: verify Stacks wallet signature.
 */
export function walletAuth(req: Request, res: Response, next: NextFunction) {
  const wallet = req.headers['x-wallet-address'] as string | undefined;
  if (wallet) {
    (req as any).walletAddress = wallet;
  }
  next();
}

/**
 * Require wallet address (use after walletAuth).
 */
export function requireWallet(req: Request, res: Response, next: NextFunction) {
  const wallet = (req as any).walletAddress;
  if (!wallet) {
    return res.status(401).json({
      error: 'Wallet address required',
      message: 'Set the x-wallet-address header with your Stacks wallet address',
    });
  }
  next();
}
