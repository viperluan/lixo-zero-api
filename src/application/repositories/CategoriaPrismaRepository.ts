import { PrismaClient } from '@prisma/client';
import Categoria from '../../domain/categoria/entity/Categoria';
import ICategoriaRepository from '../../domain/categoria/repository/ICategoriaRepository';

export default class CategoriaPrismaRepository implements ICategoriaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async buscarPorId(id: string): Promise<Categoria | null> {
    const categoria = await this.prisma.categoria.findFirst({ where: { id } });

    if (!categoria) return null;

    return Categoria.carregarCategoriaExistente(categoria);
  }

  public async buscarPorDescricao(descricao: string): Promise<Categoria | null> {
    const categoria = await this.prisma.categoria.findFirst({ where: { descricao } });
    if (!categoria) return null;

    return Categoria.carregarCategoriaExistente(categoria);
  }

  public async buscarComPaginacao(
    paginaAtual: number,
    limiteDeCategoriasPorPagina: number
  ): Promise<Categoria[] | null> {
    const listaDeCategorias = await this.prisma.categoria.findMany({
      skip: (paginaAtual - 1) * limiteDeCategoriasPorPagina,
      take: limiteDeCategoriasPorPagina,
    });

    const categorias = listaDeCategorias.map((categoria) =>
      Categoria.carregarCategoriaExistente(categoria)
    );

    return categorias;
  }

  public async buscarQuantidadeCategorias(): Promise<number> {
    const quantidadeCategorias = await this.prisma.categoria.count();

    return quantidadeCategorias;
  }

  public async salvar({ id, descricao }: Categoria): Promise<void> {
    const data = {
      id,
      descricao,
    };

    await this.prisma.categoria.create({ data });
  }

  public async atualizar({ id, descricao }: Categoria): Promise<void> {
    const data = {
      descricao,
    };

    await this.prisma.categoria.update({ where: { id }, data });
  }

  public async deletar(id: string): Promise<void> {
    await this.prisma.categoria.delete({ where: { id } });
  }
}
