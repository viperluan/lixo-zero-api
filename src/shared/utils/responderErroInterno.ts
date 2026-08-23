import { Response } from 'express';

const MENSAGEM_ERRO_INTERNO = 'Erro interno do servidor.';

export function responderErroInterno(response: Response, error: unknown) {
  console.error(error);

  if (process.env.NODE_ENV === 'production') {
    return response.status(500).json({ error: MENSAGEM_ERRO_INTERNO });
  }

  return response.status(500).json({ error: (error as Error).message });
}
