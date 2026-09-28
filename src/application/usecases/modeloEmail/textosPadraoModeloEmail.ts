import {
  camposConteudo,
  CodigoModeloEmail,
  ConteudoAcaoAprovada,
  ConteudoAcaoCadastrada,
  ConteudoAcaoReprovada,
  ConteudoModeloEmail,
} from '@/domain/modeloEmail/modeloEmail';

export const ASSUNTO_PADRAO_MODELO_EMAIL: Record<CodigoModeloEmail, string> = {
  acao_cadastrada: 'CaxiasLixoZero {ano} - Cadastro da ação: {titulo_acao}',
  acao_aprovada: 'CaxiasLixoZero {ano} - Informação de ação aprovada!',
  acao_reprovada: 'CaxiasLixoZero {ano} - Informação de ação reprovada!',
};

const URL_PASTA = 'https://drive.google.com/drive/folders/12qTWAQrkjjoVl9CW72rNawOKY21q6Byo';
const URL_INSTAGRAM = 'https://www.instagram.com/caxiaslixozero';
const URL_SITE = 'https://www.caxiaslixozero.com.br';

const RODAPE = {
  texto_assinatura: 'Um abraço,\nEquipe Coletivo Lixo Zero Caxias do Sul',
  texto_instagram: '@caxiaslixozero',
  url_instagram: URL_INSTAGRAM,
  texto_site: 'www.caxiaslixozero.com.br',
  url_site: URL_SITE,
  texto_duvida: 'Se você tiver alguma dúvida, não hesite entrar em contato!',
};

export const CONTEUDO_PADRAO_MODELO_EMAIL: {
  acao_cadastrada: ConteudoAcaoCadastrada;
  acao_aprovada: ConteudoAcaoAprovada;
  acao_reprovada: ConteudoAcaoReprovada;
} = {
  acao_cadastrada: {
    paragrafos_abertura: [
      'Muito obrigado por ter se inscrito na 6ª Semana Lixo Zero de Caxias do Sul!',
      'Estamos muito felizes com a sua participação! :)',
      'Vamos te passar algumas informações super importantes aqui. Por favor, leia com atenção para que possamos confirmar a sua inscrição!',
    ].join('\n'),
    faixa:
      'Sua inscrição foi cadastrada e assim que nossa equipe aprovar, você receberá um email informando sobre!',
    texto_antes_ficha:
      'Antes de prosseguir, gostaríamos de confirmar as informações que você cadastrou em nosso formulário:',
    rotulo_botao: 'Templates para ações - SLZ 2026',
    url_pasta: URL_PASTA,
    texto_depois_botao: 'Quanto antes você começar a divulgar seu evento, melhor!',
    convite_redes:
      'Ah, não esquece de marcar a gente para que possamos encontrar o seu post e compartilhar nas nossas redes também!',
    hashtags: ['@caxiaslixozero', '#semanalixozerocaxias', '#slzcxs'].join('\n'),
    texto_aviso_ficha:
      'Era isso mesmo? Se algo está diferente do que você planejou, ou se em algum momento houver qualquer alteração nas informações acima, por favor, nos informe pelo email caxiaslixozero@gmail.com até dia 18/10.',
    texto_responsabilidade:
      'Lembre-se: você é responsável pela organização e execução da atividade cadastrada, ok? Nós estamos aqui para tirar qualquer dúvida e te ajudar na divulgação ;)',
    paragrafo_cards:
      'Temos alguns cards e templates prontos para você divulgar a sua ação! Eles servem para ajudar na identificação das ações que fazem parte da Semana Lixo Zero e você pode editá-los para incluir as informações da sua atividade!',
    chamada_pasta: 'Dá uma olhadinha nessa pasta:',
    chamada_tags: 'Essas são as tags do nosso evento, anota aí:',
    texto_programacao:
      'Fica ligado nas nossas redes sociais para acompanhar a divulgação da programação (você vai estar lá!!) Também estaremos divulgando o cronograma completo do evento, até dia 17/10, pelo site www.caxiaslixozero.com.br',
    texto_despedida:
      'Muito obrigado por topar essa com a gente! Vamos juntos construir nossa cidade sustentável!\nVai ser incrível!',
    ...RODAPE,
    texto_copyright: '© 2024 Lixo Zero - Caxias do Sul. Todos os direitos reservados.',
  },
  acao_aprovada: {
    faixa: 'Gostariamos de informar que sua ação foi aprovada! Parabéns!',
    paragrafo_cards:
      'Temos alguns cards e templates prontos para você divulgar a sua ação! Eles servem para ajudar na identificação das ações que fazem parte da Semana Lixo Zero e você pode editá-los para incluir as informações da sua atividade!',
    rotulo_botao: 'Templates para ações - SLZ 2026',
    url_pasta: URL_PASTA,
    texto_depois_botao: 'Quanto antes você começar a divulgar seu evento, melhor!',
    paragrafo_redes:
      'Ah, não esquece de marcar a gente para que possamos encontrar o seu post e compartilhar nas nossas redes também!',
    hashtags: [
      '@caxiaslixozero',
      '#semanalixozerocaxias',
      '#slzcxs',
      '#TransformandoIdeiasEmAções',
    ].join('\n'),
    chamada_pasta: 'Dá uma olhadinha nessa pasta:',
    chamada_tags: 'Essas são as tags do nosso evento, anota aí:',
    texto_programacao:
      'Fica ligado nas nossas redes sociais para acompanhar a divulgação da programação (você vai estar lá!!) Também estaremos divulgando o cronograma completo do evento, até dia 17/10, pelo site www.caxiaslixozero.com.br',
    texto_contato: 'Caso você precisar tirar qualquer dúvida, entre em contato pelas nossas redes!',
    ...RODAPE,
    texto_copyright: '© 2025 Lixo Zero - Caxias do Sul. Todos os direitos reservados.',
  },
  acao_reprovada: {
    faixa: 'Gostaríamos de informar que sua ação foi reprovada!',
    corpo: 'Agradecemos o seu interesse. Qualquer dúvida estamos à disposição!',
    texto_despedida: 'Um abraço,',
    ...RODAPE,
    texto_assinatura: 'Equipe Coletivo Lixo Zero Caxias do Sul',
    texto_copyright: '© 2025 Lixo Zero - Caxias do Sul. Todos os direitos reservados.',
  },
};

export function conteudoPadrao(codigo: CodigoModeloEmail): ConteudoModeloEmail {
  return CONTEUDO_PADRAO_MODELO_EMAIL[codigo];
}

export function completarConteudo(
  codigo: CodigoModeloEmail,
  parcial: Record<string, unknown>
): ConteudoModeloEmail {
  const completo = { ...conteudoPadrao(codigo) } as Record<string, string>;

  for (const campo of camposConteudo(codigo)) {
    const valor = parcial[campo];
    if (typeof valor === 'string' && valor.trim().length > 0) {
      completo[campo] = valor;
    }
  }

  return completo as ConteudoModeloEmail;
}
