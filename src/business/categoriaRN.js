import { PrismaClient } from '@prisma/client';

class CategoriaRN {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async criarCategoria(descricao) {
    this.validarCategoria(descricao);

    const categoria = await this.prisma.categoria.create({
      data: { descricao },
    });

    return categoria;
  }

  async listarCategorias(pageNumber = 1, limitNumber = 10) {
    const [categories, totalCategories] = await Promise.all([
      this.prisma.categoria.findMany({
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
      }),
      this.prisma.categoria.count(),
    ]);

    return { categories, totalCategories };
  }
  validarCategoria(descricao) {
    if (!descricao) {
      throw new Error('Descrição é obrigatória.');
    }
    if (typeof descricao !== 'string' || descricao.length > 100) {
      throw new Error('Descrição não pode ter mais de 100 caracteres e deve ser texto.');
    }
  }

  async atualizarCategoria(id, descricao) {
    this.validarCategoria(descricao);
    const categoria = await this.prisma.categoria.update({
      where: { id },
      data: { descricao },
    });
    return categoria;
  }
}

export { CategoriaRN };
