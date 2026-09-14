import Redis from 'ioredis';

export type OpcoesConexaoRedis = {
  falharRapido?: boolean;
};

export function criarConexaoRedis(opcoes: OpcoesConexaoRedis = {}): Redis {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    throw new Error('REDIS_URL não configurada.');
  }

  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: !opcoes.falharRapido,
  });
}
