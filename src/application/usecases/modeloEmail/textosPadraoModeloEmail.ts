import {
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
  },
  acao_reprovada: {
    faixa: 'Gostaríamos de informar que sua ação foi reprovada!',
    corpo: 'Agradecemos o seu interesse. Qualquer dúvida estamos à disposição!',
  },
};

export function conteudoPadrao(codigo: CodigoModeloEmail): ConteudoModeloEmail {
  return CONTEUDO_PADRAO_MODELO_EMAIL[codigo];
}
