import { PrismaClient } from '@prisma/client';

class CotaRN {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async criarCota(descricao) {
    this.validarCota(descricao);

    const categoria = await this.prisma.cota.create({
      data: { descricao },
    });

    return categoria;
  }

  async listarCota(pageNumber = 1, limitNumber = 10) {
    const [quotas, totalQuotas] = await Promise.all([
      this.prisma.cota.findMany({
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
      }),
      this.prisma.cota.count(),
    ]);

    return { quotas, totalQuotas };
  }
  validarCota(descricao) {
    if (!descricao) {
      throw new Error('Descrição é obrigatória.');
    }
    if (typeof descricao !== 'string' || descricao.length > 100) {
      throw new Error('Descrição não pode ter mais de 100 caracteres e deve ser texto.');
    }
  }
}

export { CotaRN };
