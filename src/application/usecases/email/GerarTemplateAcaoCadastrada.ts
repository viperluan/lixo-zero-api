import ejs from 'ejs';
import { Usecase } from '../usecase';

export type GerarTemplateAcaoCadastradaType = {
  nome_usuario: string;
  nome_organizador: string;
  titulo_acao: string;
  data_acao: string;
  horario_acao: string;
  forma_realizacao_acao: string;
  tipo_publico_acao: string;
  link_para_inscricao_acao: string;
  link_divulgacao_acesso_acao: string;
  nome_local_acao: string;
  endereco_local_acao: string;
  informacoes_acao: string;
};

export type GerarTemplateAcaoCadastradaEntradaType = {
  caminhoTemplate: string;
  dados: GerarTemplateAcaoCadastradaType;
};

export type GerarTemplateAcaoCadastradaSaidaType = string | null;

export default class GerarTemplateAcaoCadastrada
  implements Usecase<GerarTemplateAcaoCadastradaEntradaType, GerarTemplateAcaoCadastradaSaidaType>
{
  public async executar({
    caminhoTemplate,
    dados,
  }: GerarTemplateAcaoCadastradaEntradaType): Promise<GerarTemplateAcaoCadastradaSaidaType> {
    try {
      const template = await ejs.renderFile(caminhoTemplate, dados);

      return template;
    } catch (error) {
      console.log((error as Error).message);
      return null;
    }
  }
}
