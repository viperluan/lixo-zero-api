import { PrismaClient } from '@prisma/client';
import IPatrocinadorRepository from '../../domain/patrocinador/repository/IPatrocinadorRepository';
import Patrocinador from '../../domain/patrocinador/entity/Patrocinador';

export default class PatrocinadorPrismaRepository implements IPatrocinadorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async buscarPorId(id: string): Promise<Patrocinador | null> {
    const patrocinador = await this.prisma.patrocinador.findFirst({
      where: { id },
      include: {
        cota: {
          select: {
            descricao: true,
          },
        },
        usuario_patrocinio: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!patrocinador) return null;

    return Patrocinador.carregarPatrocinadorExistente(patrocinador);
  }

  public async buscarPorNome(nome: string): Promise<Patrocinador | null> {
    const patrocinador = await this.prisma.patrocinador.findFirst({
      where: { nome },
      include: {
        cota: {
          select: {
            descricao: true,
          },
        },
        usuario_patrocinio: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!patrocinador) return null;

    return Patrocinador.carregarPatrocinadorExistente(patrocinador);
  }

  public async buscarComPaginacao(
    pagina = 1,
    limitePatrocinadores = 10
  ): Promise<Patrocinador[] | null> {
    const listaDePatrocinadores = await this.prisma.patrocinador.findMany({
      include: {
        cota: {
          select: {
            descricao: true,
          },
        },
        usuario_patrocinio: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
      skip: (pagina - 1) * limitePatrocinadores,
      take: limitePatrocinadores,
    });

    const patrocinadores = listaDePatrocinadores.map((patrocinador) =>
      Patrocinador.carregarPatrocinadorExistente(patrocinador)
    );

    return patrocinadores;
  }

  public async buscarQuantidadePatrocinadores(): Promise<number> {
    const quantidadeDePatrocinadores = await this.prisma.patrocinador.count();

    return quantidadeDePatrocinadores;
  }

  public async salvar({
    id,
    nome,
    celular,
    descricao,
    situacao,
    id_cota,
    id_usuario_alteracao,
    id_usuario_patrocinio,
    data_atualizacao,
    data_cadastro,
  }: Patrocinador): Promise<void> {
    const data = {
      id,
      nome,
      celular,
      descricao,
      situacao,
      id_cota,
      id_usuario_alteracao,
      id_usuario_patrocinio,
      data_atualizacao,
      data_cadastro,
    };

    await this.prisma.patrocinador.create({ data });
  }

  public async atualizar({ id, nome, situacao, celular, descricao }: Patrocinador): Promise<void> {
    const data = {
      nome,
      situacao,
      celular,
      descricao,
      data_atualizacao: new Date(),
    };

    await this.prisma.patrocinador.update({ where: { id }, data });
  }

  public async deletar(id: string): Promise<void> {
    await this.prisma.patrocinador.delete({ where: { id } });
  }
}
