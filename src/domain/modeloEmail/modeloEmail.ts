export const CODIGOS_MODELO_EMAIL = ['acao_cadastrada', 'acao_aprovada', 'acao_reprovada'] as const;

export type CodigoModeloEmail = (typeof CODIGOS_MODELO_EMAIL)[number];

export const ERRO_MODELO_EMAIL_NAO_ENCONTRADO = 'Modelo de e-mail não encontrado.';

export type ConteudoAcaoCadastrada = {
  paragrafos_abertura: string;
  faixa: string;
  texto_antes_ficha: string;
  rotulo_botao: string;
  url_pasta: string;
  texto_depois_botao: string;
  convite_redes: string;
  hashtags: string;
};

export type ConteudoAcaoAprovada = {
  faixa: string;
  paragrafo_cards: string;
  rotulo_botao: string;
  url_pasta: string;
  texto_depois_botao: string;
  paragrafo_redes: string;
  hashtags: string;
};

export type ConteudoAcaoReprovada = {
  faixa: string;
  corpo: string;
};

export type ConteudoModeloEmail =
  | ConteudoAcaoCadastrada
  | ConteudoAcaoAprovada
  | ConteudoAcaoReprovada;

export type ModeloEmailRegistro = {
  codigo: CodigoModeloEmail;
  assunto: string;
  conteudo: ConteudoModeloEmail;
  atualizado_em: Date | null;
  id_usuario: string | null;
};

const MARCADORES_ASSUNTO: Record<CodigoModeloEmail, readonly string[]> = {
  acao_cadastrada: ['ano', 'titulo_acao'],
  acao_aprovada: ['ano'],
  acao_reprovada: ['ano'],
};

const CAMPOS_CONTEUDO: Record<CodigoModeloEmail, readonly string[]> = {
  acao_cadastrada: [
    'paragrafos_abertura',
    'faixa',
    'texto_antes_ficha',
    'rotulo_botao',
    'url_pasta',
    'texto_depois_botao',
    'convite_redes',
    'hashtags',
  ],
  acao_aprovada: [
    'faixa',
    'paragrafo_cards',
    'rotulo_botao',
    'url_pasta',
    'texto_depois_botao',
    'paragrafo_redes',
    'hashtags',
  ],
  acao_reprovada: ['faixa', 'corpo'],
};

export function codigoModeloEmail(valor: string): CodigoModeloEmail | null {
  if ((CODIGOS_MODELO_EMAIL as readonly string[]).includes(valor)) {
    return valor as CodigoModeloEmail;
  }

  return null;
}

export function marcadoresAssunto(codigo: CodigoModeloEmail): readonly string[] {
  return MARCADORES_ASSUNTO[codigo];
}

export function camposConteudo(codigo: CodigoModeloEmail): readonly string[] {
  return CAMPOS_CONTEUDO[codigo];
}
