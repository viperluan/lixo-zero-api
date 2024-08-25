import { PrismaClient } from '@prisma/client';

import Usuario from '../../domain/usuario/entity/Usuario';
import IUsuarioRepository from '../../domain/usuario/repository/IUsuarioRepository';

export default class UsuarioPrismaRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorId(id: string): Promise<Usuario | null> {
    const idExiste = await this.prisma.usuario.findFirst({ where: { id } });

    if (!idExiste) return null;

    return Usuario.carregarUsuarioExistente(idExiste);
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

  async buscarComPaginacao(pagina = 1, limiteUsuarios = 10): Promise<Usuario[] | null> {
    const listaDeUsuarios = await this.prisma.usuario.findMany({
      skip: (pagina - 1) * limiteUsuarios,
      take: limiteUsuarios,
    });

    const usuarios = listaDeUsuarios.map((usuario) => Usuario.carregarUsuarioExistente(usuario));

    return usuarios;
  }

  async buscarQuantidadeUsuarios(): Promise<number> {
    const quantidadeUsuarios = await this.prisma.usuario.count();

    return quantidadeUsuarios;
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

    await this.prisma.usuario.update({ where: { email }, data });
  }

  async deletar(id: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }
}
