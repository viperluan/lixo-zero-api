import Acao from '../../../domain/acao/entity/Acao';
import IAcaoRepository from '../../../domain/acao/repository/IAcaoRepository';
import { Usecase } from '../usecase';

export type ListarAcoesPorDataEntradaDTO = {
  data: string;
};

type CategoriaSaidaType = {
  descricao?: string;
};

type UsuarioResponsavelSaidaType = {
  nome?: string;
  email?: string;
};

type UsuarioAlteracaoSaidaType = {
  nome?: string;
  email?: string;
};

export type ListarAcoesPorDataSaidaDTO = {
  id: string;
  nome_organizador: string;
  celular: string;
  titulo_acao: string;
  descricao_acao: string;
  id_categoria: string;
  data_acao: Date;
  forma_realizacao_acao: string;
  link_divulgacao_acesso_acao: string;
  nome_local_acao: string;
  endereco_local_acao: string;
  informacoes_acao: string;
  link_para_inscricao_acao: string;
  tipo_publico_acao: string;
  orientacao_divulgacao_acao: string;
  numero_organizadores_acao: number;
  situacao_acao: string;
  receber_informacao_patrocinio: boolean;
  data_cadastro: Date;
  data_atualizacao: Date;
  categoria?: CategoriaSaidaType;
  usuario_responsavel?: UsuarioResponsavelSaidaType;
  usuario_alteracao?: UsuarioAlteracaoSaidaType;
};

export default class ListarAcoesPorData
  implements Usecase<ListarAcoesPorDataEntradaDTO, ListarAcoesPorDataSaidaDTO[]>
{
  constructor(private readonly acaoRepository: IAcaoRepository) {}

  public async executar({
    data,
  }: ListarAcoesPorDataEntradaDTO): Promise<ListarAcoesPorDataSaidaDTO[]> {
    const objetoData = new Date(data);

    this.validarData(objetoData);

    const acoes = await this.acaoRepository.listarPorData(objetoData);

    return this.objetoDeSaida(acoes);
  }

  private validarData(data: Date) {
    if (isNaN(data.getTime())) {
      throw new Error('Data inválida.');
    }
  }

  private objetoDeSaida(acoes: Acao[] | null): ListarAcoesPorDataSaidaDTO[] {
    if (!acoes) {
      return [];
    }

    const saida: ListarAcoesPorDataSaidaDTO[] = acoes.map(
      ({
        id,
        nome_organizador,
        celular,
        titulo_acao,
        descricao_acao,
        id_categoria,
        data_acao,
        forma_realizacao_acao,
        link_divulgacao_acesso_acao,
        nome_local_acao,
        endereco_local_acao,
        informacoes_acao,
        link_para_inscricao_acao,
        tipo_publico_acao,
        orientacao_divulgacao_acao,
        numero_organizadores_acao,
        situacao_acao,
        receber_informacao_patrocinio,
        data_cadastro,
        data_atualizacao,
        categoria,
        usuario_alteracao,
        usuario_responsavel,
      }) => ({
        id,
        nome_organizador,
        celular,
        titulo_acao,
        descricao_acao,
        id_categoria,
        data_acao,
        forma_realizacao_acao,
        link_divulgacao_acesso_acao,
        nome_local_acao,
        endereco_local_acao,
        informacoes_acao,
        link_para_inscricao_acao,
        tipo_publico_acao,
        orientacao_divulgacao_acao,
        numero_organizadores_acao,
        situacao_acao,
        receber_informacao_patrocinio,
        data_cadastro,
        data_atualizacao,
        categoria,
        usuario_alteracao,
        usuario_responsavel,
      })
    );

    return saida;
  }
}
