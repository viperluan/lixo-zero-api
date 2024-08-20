import { PrismaClient } from '@prisma/client';

class PatrocionadorRN {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async criarPatrocinio(payload) {
    const { id_usuario_responsavel, celular, nome, descricao, id_cota, situacao } = payload;
    this.validarPatrocinio(payload);

    const patrocinio = await this.prisma.patrocionador.create({
      data: {
        celular: celular,
        nome: nome,
        descricao: descricao,
        cota: {
          connect: {
            id: id_cota,
          },
        },
        situacao: situacao,
        usuario_patrocinio: {
          connect: {
            id: id_usuario_responsavel,
          },
        },
      },
    });

    return patrocinio;
  }

  async listarPatrocinios(pageNumber = 1, limitNumber = 10) {
    const [partnes, totalPartnes] = await Promise.all([
      this.prisma.patrocionador.findMany({
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        select: {
          nome: true,
          celular: true,
          descricao: true,
          cota: {
            select: { descricao: true },
          },
          situacao: true,
          data_cadastro: true,
          usuario_patrocinio: {
            select: {
              nome: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.patrocionador.count(),
    ]);

    return { partnes, totalPartnes };
  }

  validarPatrocinio(payload) {
    if (!payload.descricao) {
      throw new Error('Descrição é obrigatória.');
    }
    if (typeof payload.descricao !== 'string' || payload.descricao.length > 100) {
      throw new Error('Descrição não pode ter mais de 100 caracteres e deve ser texto.');
    }
  }
}

export { PatrocionadorRN };
