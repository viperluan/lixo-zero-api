import { Prisma, PrismaClient } from '@prisma/client';
import Acao from '../../domain/acao/entity/Acao';
import IAcaoRepository from '../../domain/acao/repository/IAcaoRepository';

export type FiltrosListarComPaginacaoType = {
  id_categoria?: string;
  id_usuario?: string;
  id_usuario_responsavel?: string;
  data_acao?: string;
  search?: string;
  situacao?: string;
  forma_realizacao_acao?: string;
};

export default class AcaoPrismaRepository implements IAcaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorId(id: string): Promise<Acao | null> {
    const acao = await this.prisma.acao.findFirst({ where: { id } });

    if (!acao) return null;

    return Acao.carregarAcaoExistente(acao);
  }

  async buscarPorTitulo(titulo: string): Promise<Acao | null> {
    const acao = await this.prisma.acao.findFirst({ where: { titulo_acao: titulo } });

    if (!acao) return null;

    return Acao.carregarAcaoExistente(acao);
  }

  async buscarQuantidadeDeAcoes(): Promise<number> {
    const quantidadeDeAcoes = await this.prisma.acao.count();

    return quantidadeDeAcoes;
  }

  async listarComPaginacao(
    filtros: FiltrosListarComPaginacaoType,
    pagina = 1,
    limiteAcoes = 10
  ): Promise<Acao[] | null> {
    const where: Prisma.AcaoWhereInput = {};

    if (filtros.id_categoria) {
      where.id_categoria = filtros.id_categoria;
    }

    if (filtros.id_usuario) {
      where.id_usuario_responsavel = filtros.id_usuario;
    }

    if (filtros.data_acao) {
      where.data_acao = new Date(filtros.data_acao);
    }

    if (filtros.search) {
      where.OR = [
        { titulo_acao: { contains: filtros.search, mode: 'insensitive' } },
        { descricao_acao: { contains: filtros.search, mode: 'insensitive' } },
        { nome_organizador: { contains: filtros.search, mode: 'insensitive' } },
        { nome_local_acao: { contains: filtros.search, mode: 'insensitive' } },
      ];
    }

    if (filtros.situacao) {
      where.situacao_acao = filtros.situacao;
    }

    if (filtros.forma_realizacao_acao) {
      where.forma_realizacao_acao = filtros.forma_realizacao_acao;
    }

    const listaDeAcoes = await this.prisma.acao.findMany({
      where,
      include: {
        categoria: {
          select: {
            descricao: true,
          },
        },
        usuario_responsavel: {
          select: {
            nome: true,
            email: true,
          },
        },
        usuario_alteracao: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
      skip: (pagina - 1) * limiteAcoes,
      take: limiteAcoes,
    });

    if (!listaDeAcoes) return null;

    const acoes = listaDeAcoes.map((acao) => Acao.carregarAcaoExistente(acao));

    return acoes;
  }

  async listarPorData(data: Date): Promise<Acao[] | null> {
    const listaAcoes = await this.prisma.acao.findMany({
      where: {
        data_acao: {
          equals: data,
        },
      },
    });

    if (!listaAcoes) return null;

    const acoes = listaAcoes.map((acao) => Acao.carregarAcaoExistente(acao));

    return acoes;
  }

  async listarPorIntervaloData(dataInicial: Date, dataFinal: Date): Promise<Acao[] | null> {
    const listaAcoes = await this.prisma.acao.findMany({
      where: {
        data_acao: {
          gte: dataInicial,
          lte: dataFinal,
        },
      },
    });

    if (!listaAcoes) return null;

    const acoes = listaAcoes.map((acao) => Acao.carregarAcaoExistente(acao));

    return acoes;
  }

  async salvar({
    celular,
    data_acao,
    data_atualizacao,
    data_cadastro,
    descricao_acao,
    forma_realizacao_acao,
    id,
    id_categoria,
    id_usuario_alteracao,
    id_usuario_responsavel,
    link_divulgacao_acesso_acao,
    link_para_inscricao_acao,
    endereco_local_acao,
    informacoes_acao,
    nome_local_acao,
    tipo_publico_acao,
    nome_organizador,
    numero_organizadores_acao,
    receber_informacao_patrocinio,
    situacao_acao,
    titulo_acao,
    orientacao_divulgacao_acao,
  }: Acao): Promise<void> {
    const data = {
      celular,
      data_acao,
      data_atualizacao,
      data_cadastro,
      descricao_acao,
      forma_realizacao_acao,
      id,
      id_categoria,
      id_usuario_alteracao,
      id_usuario_responsavel,
      link_divulgacao_acesso_acao,
      link_para_inscricao_acao,
      endereco_local_acao,
      informacoes_acao,
      nome_local_acao,
      tipo_publico_acao,
      nome_organizador,
      numero_organizadores_acao,
      receber_informacao_patrocinio,
      situacao_acao,
      titulo_acao,
      orientacao_divulgacao_acao,
    };

    await this.prisma.acao.create({ data });
  }

  async atualizar(
    id: string,
    campos: Pick<Acao, 'situacao_acao' | 'id_usuario_alteracao'>
  ): Promise<Acao> {
    const acaoAtualizada = await this.prisma.acao.update({
      where: { id },
      data: {
        situacao_acao: campos.situacao_acao,
        id_usuario_alteracao: campos.id_usuario_alteracao,
      },
    });

    return Acao.carregarAcaoExistente(acaoAtualizada);
  }

  async deletar(id: string): Promise<void> {
    await this.prisma.acao.delete({ where: { id } });
  }
}
