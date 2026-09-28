export const CODIGOS_MODELO_EMAIL = ['acao_cadastrada', 'acao_aprovada', 'acao_reprovada'] as const;

export type CodigoModeloEmail = (typeof CODIGOS_MODELO_EMAIL)[number];

export const ERRO_MODELO_EMAIL_NAO_ENCONTRADO = 'Modelo de e-mail não encontrado.';

export type ConteudoRodapeEmail = {
  texto_assinatura: string;
  texto_instagram: string;
  url_instagram: string;
  texto_site: string;
  url_site: string;
  texto_duvida: string;
  texto_copyright: string;
};

export type ConteudoAcaoCadastrada = ConteudoRodapeEmail & {
  paragrafos_abertura: string;
  faixa: string;
  texto_antes_ficha: string;
  texto_aviso_ficha: string;
  texto_responsabilidade: string;
  paragrafo_cards: string;
  chamada_pasta: string;
  rotulo_botao: string;
  url_pasta: string;
  texto_depois_botao: string;
  convite_redes: string;
  chamada_tags: string;
  hashtags: string;
  texto_programacao: string;
  texto_despedida: string;
};

export type ConteudoAcaoAprovada = ConteudoRodapeEmail & {
  faixa: string;
  paragrafo_cards: string;
  chamada_pasta: string;
  rotulo_botao: string;
  url_pasta: string;
  texto_depois_botao: string;
  paragrafo_redes: string;
  chamada_tags: string;
  hashtags: string;
  texto_programacao: string;
  texto_contato: string;
};

export type ConteudoAcaoReprovada = ConteudoRodapeEmail & {
  faixa: string;
  corpo: string;
  texto_despedida: string;
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
    'texto_aviso_ficha',
    'texto_responsabilidade',
    'paragrafo_cards',
    'chamada_pasta',
    'rotulo_botao',
    'url_pasta',
    'texto_depois_botao',
    'convite_redes',
    'chamada_tags',
    'hashtags',
    'texto_programacao',
    'texto_despedida',
    'texto_assinatura',
    'texto_instagram',
    'url_instagram',
    'texto_site',
    'url_site',
    'texto_duvida',
    'texto_copyright',
  ],
  acao_aprovada: [
    'faixa',
    'paragrafo_cards',
    'chamada_pasta',
    'rotulo_botao',
    'url_pasta',
    'texto_depois_botao',
    'paragrafo_redes',
    'chamada_tags',
    'hashtags',
    'texto_programacao',
    'texto_contato',
    'texto_assinatura',
    'texto_instagram',
    'url_instagram',
    'texto_site',
    'url_site',
    'texto_duvida',
    'texto_copyright',
  ],
  acao_reprovada: [
    'faixa',
    'corpo',
    'texto_despedida',
    'texto_assinatura',
    'texto_instagram',
    'url_instagram',
    'texto_site',
    'url_site',
    'texto_duvida',
    'texto_copyright',
  ],
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
