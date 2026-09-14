export const NOME_FILA_EMAIL = 'emails';

const LIMITE_EMAILS_POR_JANELA = 5;
const JANELA_LIMITE_EMAIL_MS = 60_000;
const JOBS_CONCLUIDOS_MANTIDOS = 100;
const JOBS_FALHOS_MANTIDOS = 200;

function lerNumeroEnv(nome: string, padrao: number): number {
  const valor = process.env[nome]?.trim();

  if (!valor) return padrao;

  const numero = Number(valor);

  return Number.isFinite(numero) && numero > 0 ? numero : padrao;
}

export function obterOpcoesPadraoJobEmail() {
  return {
    attempts: lerNumeroEnv('FILA_EMAIL_TENTATIVAS', 5),
    backoff: {
      type: 'exponential' as const,
      delay: lerNumeroEnv('FILA_EMAIL_BACKOFF_MS', 5_000),
    },
    removeOnComplete: { count: JOBS_CONCLUIDOS_MANTIDOS },
    removeOnFail: { count: JOBS_FALHOS_MANTIDOS },
  };
}

export function obterOpcoesWorkerEmail() {
  return {
    concurrency: lerNumeroEnv('FILA_EMAIL_CONCORRENCIA', 1),
    limiter: {
      max: LIMITE_EMAILS_POR_JANELA,
      duration: JANELA_LIMITE_EMAIL_MS,
    },
  };
}
