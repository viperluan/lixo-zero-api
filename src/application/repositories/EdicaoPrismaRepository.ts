import { Prisma, PrismaClient } from '@prisma/client';
import Edicao from '@/domain/edicao/entity/Edicao';
import IEdicaoRepository, {
  AtualizarDatasEdicao,
  ProrrogacaoEdicaoRegistro,
} from '@/domain/edicao/repository/IEdicaoRepository';
import { ERRO_ANO_JA_CADASTRADO, ERRO_EDICAO_VINCULADA_A_ACOES } from '@/domain/edicao/erros';
import { intervaloDoDiaCivil } from '@/shared/utils/diaCivil';

export default class EdicaoPrismaRepository implements IEdicaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorId(id: string): Promise<Edicao | null> {
    const edicao = await this.prisma.edicao.findFirst({ where: { id } });
    if (!edicao) return null;

    return Edicao.carregarEdicaoExistente(edicao);
  }

  async buscarPorAno(ano: number): Promise<Edicao | null> {
    const edicao = await this.prisma.edicao.findFirst({ where: { ano } });
    if (!edicao) return null;

    return Edicao.carregarEdicaoExistente(edicao);
  }

  async buscarVigente(): Promise<Edicao | null> {
    const edicao = await this.prisma.edicao.findFirst({ where: { vigente: true } });
    if (!edicao) return null;

    return Edicao.carregarEdicaoExistente(edicao);
  }

  async listar(): Promise<Edicao[]> {
    const edicoes = await this.prisma.edicao.findMany({ orderBy: { ano: 'desc' } });

    return edicoes.map((edicao) => Edicao.carregarEdicaoExistente(edicao));
  }

  async listarProrrogacoes(idEdicao: string): Promise<ProrrogacaoEdicaoRegistro[]> {
    const prorrogacoes = await this.prisma.prorrogacaoEdicao.findMany({
      where: { id_edicao: idEdicao },
      orderBy: { prorrogada_em: 'asc' },
      include: { usuario: { select: { nome: true } } },
    });

    return prorrogacoes.map((prorrogacao) => ({
      id: prorrogacao.id,
      data_fim_cadastro_anterior: prorrogacao.data_fim_cadastro_anterior,
      data_fim_cadastro_nova: prorrogacao.data_fim_cadastro_nova,
      prorrogada_em: prorrogacao.prorrogada_em,
      id_usuario: prorrogacao.id_usuario,
      nome_usuario: prorrogacao.usuario.nome,
    }));
  }

  async salvar(edicao: Edicao): Promise<void> {
    const data = dadosEdicao(edicao);

    try {
      await this.prisma.$transaction(async (transacao) => {
        if (edicao.vigente) {
          await transacao.edicao.updateMany({
            where: { vigente: true },
            data: { vigente: false },
          });
        }

        await transacao.edicao.create({ data });
      });
    } catch (error) {
      traduzirConflitoUnico(error);
    }
  }

  async prorrogar(idEdicao: string, dataFimCadastro: Date, idUsuario: string): Promise<void> {
    await this.prisma.$transaction(async (transacao) => {
      const edicao = await transacao.edicao.findFirst({ where: { id: idEdicao } });
      if (!edicao) return;

      await transacao.prorrogacaoEdicao.create({
        data: {
          id_edicao: idEdicao,
          data_fim_cadastro_anterior: edicao.data_fim_cadastro,
          data_fim_cadastro_nova: dataFimCadastro,
          id_usuario: idUsuario,
        },
      });

      await transacao.edicao.update({
        where: { id: idEdicao },
        data: { data_fim_cadastro: dataFimCadastro },
      });
    });
  }

  async alterarInscricoes(idEdicao: string, inscricoesAbertas: boolean): Promise<void> {
    await this.prisma.edicao.update({
      where: { id: idEdicao },
      data: { inscricoes_abertas: inscricoesAbertas },
    });
  }

  async tornarVigente(idEdicao: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (transacao) => {
        await transacao.edicao.updateMany({
          where: { vigente: true },
          data: { vigente: false },
        });

        await transacao.edicao.update({
          where: { id: idEdicao },
          data: { vigente: true },
        });
      });
    } catch (error) {
      traduzirConflitoUnico(error);
    }
  }

  async atualizarDatas(idEdicao: string, datas: AtualizarDatasEdicao): Promise<void> {
    await this.prisma.edicao.update({
      where: { id: idEdicao },
      data: datas,
    });
  }

  async contarAcoes(idEdicao: string): Promise<number> {
    return this.prisma.acao.count({ where: { id_edicao: idEdicao } });
  }

  async contarAcoesForaDaRealizacao(
    idEdicao: string,
    inicio: string,
    fim: string
  ): Promise<number> {
    const aPartirDe = intervaloDoDiaCivil(inicio).inicio;
    const ate = intervaloDoDiaCivil(fim).fim;

    return this.prisma.acao.count({
      where: {
        id_edicao: idEdicao,
        OR: [{ data_acao: { lt: aPartirDe } }, { data_acao: { gt: ate } }],
      },
    });
  }

  async deletar(idEdicao: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (transacao) => {
        await transacao.prorrogacaoEdicao.deleteMany({ where: { id_edicao: idEdicao } });
        await transacao.edicao.delete({ where: { id: idEdicao } });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        throw new Error(ERRO_EDICAO_VINCULADA_A_ACOES);
      }

      throw error;
    }
  }
}

function dadosEdicao(edicao: Edicao) {
  return {
    id: edicao.id,
    ano: edicao.ano,
    data_inicio_cadastro: edicao.data_inicio_cadastro,
    data_fim_cadastro: edicao.data_fim_cadastro,
    data_inicio_realizacao: edicao.data_inicio_realizacao,
    data_fim_realizacao: edicao.data_fim_realizacao,
    inscricoes_abertas: edicao.inscricoes_abertas,
    vigente: edicao.vigente,
  };
}

function traduzirConflitoUnico(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const alvo = String(error.meta?.target ?? '');

    if (alvo.includes('ano')) throw new Error(ERRO_ANO_JA_CADASTRADO);
    if (alvo.includes('vigente')) throw new Error('Já existe uma edição vigente.');
  }

  throw error;
}
