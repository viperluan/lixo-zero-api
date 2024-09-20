import Acao from '../../../domain/acao/entity/Acao';
import IAcaoRepository from '../../../domain/acao/repository/IAcaoRepository';
import { FiltrosListarComPaginacaoType } from '../../repositories/AcaoPrismaRepository';
import { Usecase } from '../usecase';

type ListarAcoesDTO = {
  id: string;
  nome_organizador: string;
  celular: string;
  titulo_acao: string;
  descricao_acao: string;
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

  categoria?: {
    descricao?: string;
  };
  usuario_responsavel?: {
    nome?: string;
    email?: string;
  };
  usuario_alteracao?: {
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
        nome_organizador,
        celular,
        titulo_acao,
        descricao_acao,
        data_acao,
        forma_realizacao_acao_texto,
        link_divulgacao_acesso_acao,
        nome_local_acao,
        endereco_local_acao,
        informacoes_acao,
        link_para_inscricao_acao,
        tipo_publico_acao_texto,
        orientacao_divulgacao_acao,
        numero_organizadores_acao,
        situacao_acao_texto,
        receber_informacao_patrocinio,
        data_cadastro,
        data_atualizacao,
        categoria,
        usuario_responsavel,
        usuario_alteracao,
      }) => {
        return {
          id,
          nome_organizador,
          celular,
          titulo_acao,
          descricao_acao,
          data_acao,
          forma_realizacao_acao: forma_realizacao_acao_texto,
          link_divulgacao_acesso_acao,
          nome_local_acao,
          endereco_local_acao,
          informacoes_acao,
          link_para_inscricao_acao,
          tipo_publico_acao: tipo_publico_acao_texto,
          orientacao_divulgacao_acao,
          numero_organizadores_acao,
          situacao_acao: situacao_acao_texto,
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
