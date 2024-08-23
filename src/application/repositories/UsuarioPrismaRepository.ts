import { PrismaClient } from '@prisma/client';

import Usuario from '../../domain/entities/Usuario';
import IUsuarioRepository from '../../domain/repositories/IUsuarioRepository';

export default class UsuarioPrismaRepository implements IUsuarioRepository {
  readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const emailExiste = await this.prisma.usuario.findFirst({ where: { email } });

    if (!emailExiste) return null;

    return Usuario.carregarUsuarioExistente(emailExiste);
  }

  async buscarPorCpfCnpj(cpf_cnpj: string): Promise<Usuario | null> {
    const cpfCnpjExiste = await this.prisma.usuario.findFirst({ where: { cpf_cnpj } });

    if (!cpfCnpjExiste) return null;

    return Usuario.carregarUsuarioExistente(cpfCnpjExiste);
  }

  async salvar({ id, nome, email, senha, cpf_cnpj, status, tipo }: Usuario): Promise<void> {
    const data = {
      id,
      nome,
      email,
      senha,
      cpf_cnpj,
      status,
      tipo,
    };

    await this.prisma.usuario.create({ data });
  }

  async atualizar({
    nome,
    email,
    senha,
    cpf_cnpj,
  }: Omit<Usuario, 'id' | 'status' | 'tipo'>): Promise<void> {
    const data = {
      nome,
      email,
      senha,
      cpf_cnpj,
    };

    await this.prisma.usuario.create({ data });
  }

  async deletar(id: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }
}
