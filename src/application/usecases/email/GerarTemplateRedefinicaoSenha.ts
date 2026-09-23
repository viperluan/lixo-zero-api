import ejs from 'ejs';
import { Usecase } from '../usecase';

export type GerarTemplateRedefinicaoSenhaType = {
  nome_usuario: string;
  link_redefinicao: string;
};

export type GerarTemplateRedefinicaoSenhaEntradaType = {
  caminhoTemplate: string;
  dados: GerarTemplateRedefinicaoSenhaType;
};

export type GerarTemplateRedefinicaoSenhaSaidaType = string | null;

export default class GerarTemplateRedefinicaoSenha
  implements
    Usecase<GerarTemplateRedefinicaoSenhaEntradaType, GerarTemplateRedefinicaoSenhaSaidaType>
{
  public async executar({
    caminhoTemplate,
    dados,
  }: GerarTemplateRedefinicaoSenhaEntradaType): Promise<GerarTemplateRedefinicaoSenhaSaidaType> {
    try {
      const template = await ejs.renderFile(caminhoTemplate, dados);

      return template;
    } catch (error) {
      console.log((error as Error).message);
      return null;
    }
  }
}
