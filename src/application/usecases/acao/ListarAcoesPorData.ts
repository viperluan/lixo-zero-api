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
  titulo_acao: string;
  descricao_acao: string;
  nome_organizador: string;
  link_organizador: string;
  data_acao: Date;
  forma_realizacao_acao: string;
  local_acao: string;
  situacao_acao: string;
  numero_organizadores_acao: number;
  celular: string;
  receber_informacao_patrocinio: boolean;
  data_cadastro: Date;
  data_atualizacao: Date;
  categoria: CategoriaSaidaType;
  usuario_responsavel: UsuarioResponsavelSaidaType;
  usuario_alteracao: UsuarioAlteracaoSaidaType;
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
        titulo_acao,
        descricao_acao,
        nome_organizador,
        link_organizador,
        data_acao,
        forma_realizacao_acao,
        local_acao,
        situacao_acao,
        numero_organizadores_acao,
        celular,
        receber_informacao_patrocinio,
        data_cadastro,
        data_atualizacao,
        categoria,
        usuario_responsavel,
        usuario_alteracao,
      }) => ({
        id,
        titulo_acao,
        descricao_acao,
        nome_organizador,
        link_organizador,
        data_acao,
        forma_realizacao_acao,
        local_acao,
        situacao_acao,
        numero_organizadores_acao,
        celular,
        receber_informacao_patrocinio,
        data_cadastro,
        data_atualizacao,
        categoria,
        usuario_responsavel,
        usuario_alteracao,
      })
    );

    return saida;
  }
}
