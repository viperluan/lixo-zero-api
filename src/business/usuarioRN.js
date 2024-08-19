import { PrismaClient } from "@prisma/client";
import { isEmpty } from "../utils/StringUtils.js";
import crypto from "crypto";

class UsuarioRN {
  constructor() {
    this.prisma = new PrismaClient();
  }

  criptografarSenha(senha) {
    return crypto.createHash("md5").update(senha).digest("hex");
  }

  async criarUsuario(data) {
    this.validarUsuario(data);
    await this.verificarUsuarioExistente(data);
    const nome = data.nome;
    const email = data.email;
    const senha = this.criptografarSenha(data.senha);
    const tipo = data.tipo;
    const cpf_cnpj = data.cpf_cnpj;

    return (
      await this.prisma.usuario.create({
        data: { nome, email, senha, tipo, cpf_cnpj },
      })
    ).id;
  }

  validarUsuario(data) {
    if (isEmpty(data)) {
      throw new Error("Nenhum dado informado para cadastro.");
    }

    if (isEmpty(data.nome)) {
      throw new Error("Nome não informado.");
    }

    if (isEmpty(data.email)) {
      throw new Error("Email não informado.");
    }

    if (isEmpty(data.senha)) {
      throw new Error("Senha não informada.");
    }

    if (isEmpty(data.tipo)) {
      throw new Error("Tipo de usuário não informado.");
    }

    if (isEmpty(data.cpf_cnpj)) {
      throw new Error("CPF/CNPJ não informado.");
    }
  }

  async listarUsuarios(pageNumber = 1, limitNumber = 10) {
    const [users, totalUsers] = await Promise.all([
      this.prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          status: true,
          tipo: true,
          cpf_cnpj: true,
        },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
      }),
      this.prisma.usuario.count(),
    ]);

    return { users, totalUsers };
  }

  async verificarUsuarioExistente(data) {
    if (await this.emailJaCadastrado(data.email)) {
      throw new Error("Email já cadastrado.");
    }

    if (await this.cpfcnpjJaCadastrado(data.cpf_cnpj)) {
      throw new Error("CPF/CNPJ já cadastrado.");
    }
  }

  async emailJaCadastrado(email) {
    return (
      (await this.prisma.usuario.findFirst({
        where: {
          email: email,
        },
        select: {
          id: true,
        },
      })) !== null
    );
  }

  async cpfcnpjJaCadastrado(cpfcnpj) {
    return (
      (await this.prisma.usuario.findFirst({
        where: {
          cpf_cnpj: cpfcnpj,
        },
        select: {
          id: true,
        },
      })) !== null
    );
  }

  async deletarUsuarioPorId(id) {
    if (isNaN(id)) {
      throw new Error("ID inválido");
    }

    return await this.prisma.usuario.delete({
      where: {
        id: Number(id),
      },
    });
  }

  async buscarPorLogin(data) {
    if (isEmpty(data.email)) {
      throw new Error("Email não informado.");
    }

    if (isEmpty(data.senha)) {
      throw new Error("Senha não informada.");
    }

    const user = await this.prisma.usuario.findFirst({
      select: {
        id: true,
        nome: true,
        tipo: true,
        email: true,
      },
      where: {
        email: data.email,
        senha: this.criptografarSenha(data.senha),
      },
    });

    if (user == null) {
      throw new Error("E-mail ou senha incorretos.");
    }

    return user;
  }
}

export { UsuarioRN };
