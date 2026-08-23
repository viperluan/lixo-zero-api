type UsuarioAcaoResumo = {
  nome?: string;
  email?: string;
};

type AcaoComDadosSensiveis = {
  celular?: string;
  usuario_responsavel?: UsuarioAcaoResumo;
  usuario_alteracao?: UsuarioAcaoResumo;
  [chave: string]: unknown;
};

export function sanitizarAcaoResposta<T extends AcaoComDadosSensiveis>(acao: T): T {
  const acaoSanitizada = {
    ...acao,
    usuario_responsavel: acao.usuario_responsavel?.nome
      ? { nome: acao.usuario_responsavel.nome }
      : undefined,
    usuario_alteracao: acao.usuario_alteracao?.nome
      ? { nome: acao.usuario_alteracao.nome }
      : undefined,
  };

  delete acaoSanitizada.celular;

  return acaoSanitizada as T;
}

export function sanitizarListaAcoesResposta<T extends AcaoComDadosSensiveis>(acoes: T[]): T[] {
  return acoes.map(sanitizarAcaoResposta);
}
