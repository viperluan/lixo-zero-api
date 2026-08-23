import { Request, Response } from 'express';
import { prisma } from '../../../shared/package/prisma';

export async function verificar(_request: Request, response: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    response.status(200).json({ status: 'ok', database: 'up' });
  } catch {
    response.status(503).json({ status: 'error', database: 'down' });
  }
}
