import { PrismaClient } from '@prisma/client';
import { RedefinicaoSenha } from '@/domain/usuario/tokenRedefinicaoSenha';
import IRedefinicaoSenhaRepository from '@/domain/usuario/repository/IRedefinicaoSenhaRepository';

const camposRedefinicao = {
  id: true,
  id_usuario: true,
  expira_em: true,
  usado_em: true,
  criado_em: true,
} as const;

export default class RedefinicaoSenhaPrismaRepository implements IRedefinicaoSenhaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorTokenHash(tokenHash: string): Promise<RedefinicaoSenha | null> {
    return this.prisma.redefinicaoSenha.findUnique({
      where: { token_hash: tokenHash },
      select: camposRedefinicao,
    });
  }

  async buscarMaisRecentePorUsuario(idUsuario: string): Promise<RedefinicaoSenha | null> {
    return this.prisma.redefinicaoSenha.findFirst({
      where: { id_usuario: idUsuario },
      orderBy: { criado_em: 'desc' },
      select: camposRedefinicao,
    });
  }

  async substituirToken(idUsuario: string, tokenHash: string, expiraEm: Date): Promise<void> {
    const agora = new Date();

    await this.prisma.$transaction([
      this.prisma.redefinicaoSenha.updateMany({
        where: { id_usuario: idUsuario, usado_em: null },
        data: { usado_em: agora },
      }),
      this.prisma.redefinicaoSenha.create({
        data: {
          id_usuario: idUsuario,
          token_hash: tokenHash,
          expira_em: expiraEm,
        },
      }),
    ]);
  }

  async consumir(
    id: string,
    idUsuario: string,
    senha: string,
    senha_alterada_em: Date
  ): Promise<boolean> {
    return this.prisma.$transaction(async (transacao) => {
      const consumo = await transacao.redefinicaoSenha.updateMany({
        where: { id, usado_em: null, expira_em: { gt: new Date() } },
        data: { usado_em: new Date() },
      });

      if (consumo.count !== 1) return false;

      await transacao.usuario.update({
        where: { id: idUsuario },
        data: { senha, senha_alterada_em },
      });

      return true;
    });
  }
}
