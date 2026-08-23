import { Request, Response } from 'express';

export async function verificar(_request: Request, response: Response) {
  response.status(200).json({ status: 'ok' });
}
