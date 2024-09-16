import ejs from 'ejs';
import { Usecase } from '../usecase';

export type GerarTemplateAcaoAprovadaType = {
  nome_usuario: string;
};

export type GerarTemplateAcaoAprovadaEntradaType = {
  caminhoTemplate: string;
  dados: GerarTemplateAcaoAprovadaType;
};

export type GerarTemplateAcaoAprovadaSaidaType = string | null;

export default class GerarTemplateAcaoAprovada
  implements Usecase<GerarTemplateAcaoAprovadaEntradaType, GerarTemplateAcaoAprovadaSaidaType>
{
  public async executar({
    caminhoTemplate,
    dados,
  }: GerarTemplateAcaoAprovadaEntradaType): Promise<GerarTemplateAcaoAprovadaSaidaType> {
    try {
      const template = await ejs.renderFile(caminhoTemplate, dados);

      return template;
    } catch (error) {
      console.log((error as Error).message);
      return null;
    }
  }
}
