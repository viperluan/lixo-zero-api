import Acao from '../../../domain/acao/entity/Acao';
import IAcaoRepository from '../../../domain/acao/repository/IAcaoRepository';
import { Usecase } from '../usecase';

export type ListarAcoesPorIntervaloDataEntradaDTO = {
  dataInicial: string;
  dataFinal: string;
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

export type ListarAcoesPorIntervaloDataSaidaDTO = {
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

export default class ListarAcoesPorIntervaloData
  implements Usecase<ListarAcoesPorIntervaloDataEntradaDTO, ListarAcoesPorIntervaloDataSaidaDTO[]>
{
  constructor(private readonly acaoRepository: IAcaoRepository) {}

  public async executar({
    dataInicial,
    dataFinal,
  }: ListarAcoesPorIntervaloDataEntradaDTO): Promise<ListarAcoesPorIntervaloDataSaidaDTO[]> {
    const objetoDataInicial = new Date(dataInicial);
    const objetoDataFinal = new Date(dataFinal);

    this.validarDatas(objetoDataInicial, objetoDataFinal);

    const listaAcoes = await this.acaoRepository.listarPorIntervaloData(
      objetoDataInicial,
      objetoDataFinal
    );

    return this.objetoDeSaida(listaAcoes);
  }

  private validarDatas(dataInicial: Date, dataFinal: Date) {
    if (isNaN(dataInicial.getTime())) {
      throw new Error('Data inicial inválida.');
    }

    if (isNaN(dataFinal.getTime())) {
      throw new Error('Data final inválida.');
    }

    if (dataInicial > dataFinal) {
      throw new Error('A data de início deve ser anterior à data de fim.');
    }
  }

  private objetoDeSaida(acoes: Acao[] | null) {
    if (!acoes) {
      return [];
    }

    const acoesSaida: ListarAcoesPorIntervaloDataSaidaDTO[] = acoes.map(
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
        usuario_responsavel,
        usuario_alteracao,
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
        usuario_responsavel,
        usuario_alteracao,
      })
    );

    return acoesSaida;
  }
}
