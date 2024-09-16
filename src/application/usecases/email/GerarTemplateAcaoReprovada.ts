import ejs from 'ejs';
import { Usecase } from '../usecase';

export type GerarTemplateAcaoReprovadaType = {
  nome_usuario: string;
};

export type GerarTemplateAcaoReprovadaEntradaType = {
  caminhoTemplate: string;
  dados: GerarTemplateAcaoReprovadaType;
};

export type GerarTemplateAcaoReprovadaSaidaType = string | null;

export default class GerarTemplateAcaoReprovada
  implements Usecase<GerarTemplateAcaoReprovadaEntradaType, GerarTemplateAcaoReprovadaSaidaType>
{
  public async executar({
    caminhoTemplate,
    dados,
  }: GerarTemplateAcaoReprovadaEntradaType): Promise<GerarTemplateAcaoReprovadaSaidaType> {
    try {
      const template = await ejs.renderFile(caminhoTemplate, dados);

      return template;
    } catch (error) {
      console.log((error as Error).message);
      return null;
    }
  }
}
