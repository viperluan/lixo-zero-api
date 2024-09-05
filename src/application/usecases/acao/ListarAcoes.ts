import Acao from '../../../domain/acao/entity/Acao';
import IAcaoRepository from '../../../domain/acao/repository/IAcaoRepository';
import { FiltrosListarComPaginacaoType } from '../../repositories/AcaoPrismaRepository';
import { Usecase } from '../usecase';

type ListarAcoesDTO = {
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
  categoria: {
    descricao?: string;
  };
  usuario_responsavel: {
    nome?: string;
    email?: string;
  };
  usuario_alteracao: {
    nome?: string;
    email?: string;
  };
};

type ObjetoSaidaProps = {
  acoes: Acao[] | null;
  totalAcoes: number;
  paginaAtual: number;
  limiteDeAcoesPorPagina: number;
};

export type ListarAcoesEntradaDTO = {
  filtros: FiltrosListarComPaginacaoType;
  paginaAtual: number;
  limiteDeAcoesPorPagina: number;
};

export type ListarAcoesSaidaDTO = {
  acoes: ListarAcoesDTO[];
  totalDePaginas: number;
};

export default class ListarAcoes implements Usecase<ListarAcoesEntradaDTO, ListarAcoesSaidaDTO> {
  constructor(private readonly acaoRepository: IAcaoRepository) {}

  async executar({
    filtros,
    limiteDeAcoesPorPagina,
    paginaAtual,
  }: ListarAcoesEntradaDTO): Promise<ListarAcoesSaidaDTO> {
    const acoes = await this.acaoRepository.listarComPaginacao(
      filtros,
      paginaAtual,
      limiteDeAcoesPorPagina
    );
    const totalAcoes = await this.acaoRepository.buscarQuantidadeDeAcoes();

    return this.objetoDeSaida({ acoes, totalAcoes, paginaAtual, limiteDeAcoesPorPagina });
  }

  private objetoDeSaida({ acoes, totalAcoes, limiteDeAcoesPorPagina }: ObjetoSaidaProps) {
    if (!acoes) {
      return {
        acoes: [],
        totalDePaginas: 1,
      } as ListarAcoesSaidaDTO;
    }

    const acoesSaidaDto: ListarAcoesDTO[] = acoes.map(
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
      }) => {
        return {
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
        };
      }
    );

    const saida: ListarAcoesSaidaDTO = {
      acoes: acoesSaidaDto,
      totalDePaginas: Math.ceil(totalAcoes / limiteDeAcoesPorPagina),
    };

    return saida;
  }
}
