import ejs from 'ejs';
import {
  CodigoModeloEmail,
  ConteudoModeloEmail,
  ModeloEmailRegistro,
} from '@/domain/modeloEmail/modeloEmail';
import { resolveCaminhoArquivoTemplate } from '@/shared/utils/resolveCaminhoArquivoTemplate';
import { aplicarMarcadoresAssunto } from './validarModeloEmail';
import { ASSUNTO_PADRAO_MODELO_EMAIL, conteudoPadrao } from './textosPadraoModeloEmail';

const ARQUIVO_TEMPLATE: Record<CodigoModeloEmail, string> = {
  acao_cadastrada: 'NotificacaoAcaoCriada.ejs',
  acao_aprovada: 'NotificacaoAcaoAprovada.ejs',
  acao_reprovada: 'NotificacaoAcaoReprovada.ejs',
};

export type TextosModeloEmail = {
  assunto: string;
  conteudo: ConteudoModeloEmail;
};

export function textosEfetivos(
  codigo: CodigoModeloEmail,
  gravado: ModeloEmailRegistro | null
): TextosModeloEmail {
  if (!gravado) {
    return {
      assunto: ASSUNTO_PADRAO_MODELO_EMAIL[codigo],
      conteudo: conteudoPadrao(codigo),
    };
  }

  return { assunto: gravado.assunto, conteudo: gravado.conteudo };
}

export async function renderizarModeloEmail(
  codigo: CodigoModeloEmail,
  textos: TextosModeloEmail,
  dados: Record<string, string>
): Promise<{ assunto: string; html: string }> {
  const assunto = aplicarMarcadoresAssunto(textos.assunto, dados);
  const html = await ejs.renderFile(resolveCaminhoArquivoTemplate(ARQUIVO_TEMPLATE[codigo]), {
    ...dados,
    ...textos.conteudo,
  });

  if (typeof html !== 'string' || html.length === 0) {
    throw new Error('Erro ao gerar template.');
  }

  return { assunto, html };
}
