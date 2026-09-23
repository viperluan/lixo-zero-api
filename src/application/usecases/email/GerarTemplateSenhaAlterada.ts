import ejs from 'ejs';
import { Usecase } from '../usecase';

export type GerarTemplateSenhaAlteradaType = {
  nome_usuario: string;
};

export type GerarTemplateSenhaAlteradaEntradaType = {
  caminhoTemplate: string;
  dados: GerarTemplateSenhaAlteradaType;
};

export type GerarTemplateSenhaAlteradaSaidaType = string | null;

export default class GerarTemplateSenhaAlterada
  implements Usecase<GerarTemplateSenhaAlteradaEntradaType, GerarTemplateSenhaAlteradaSaidaType>
{
  public async executar({
    caminhoTemplate,
    dados,
  }: GerarTemplateSenhaAlteradaEntradaType): Promise<GerarTemplateSenhaAlteradaSaidaType> {
    try {
      const template = await ejs.renderFile(caminhoTemplate, dados);

      return template;
    } catch (error) {
      console.log((error as Error).message);
      return null;
    }
  }
}
