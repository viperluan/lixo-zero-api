const LIMITE_PADRAO = 10;
const LIMITE_MAXIMO = 100;

export function normalizarPaginacao(page: unknown, limit: unknown) {
  const paginaAtual = Number(page) > 0 ? Number(page) : 1;
  const limiteInformado = Number(limit) > 0 ? Number(limit) : LIMITE_PADRAO;
  const limite = Math.min(limiteInformado, LIMITE_MAXIMO);

  return { paginaAtual, limite };
}
