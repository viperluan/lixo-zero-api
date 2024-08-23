import { Request, Response } from 'express';
import UsuarioPrismaRepository from '../application/repositories/UsuarioPrismaRepository';
import CriarUsuario from '../application/usecases/CriarUsuario';
import AutenticarUsuario from '../application/usecases/AutenticarUsuario';

const usuarioPrismaRepository = new UsuarioPrismaRepository();

export async function criar(request: Request, response: Response) {
  try {
    const { nome, email, senha, cpf_cnpj } = request.body;

    const criarUsuario = new CriarUsuario(usuarioPrismaRepository);
    await criarUsuario.executar({ nome, email, senha, cpf_cnpj });

    response.status(201).end();
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function buscarTodos(request: Request, response: Response) {
  try {
    const { page = 1, limit = 10 } = request.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const { users, totalUsers } = await usuarioRN.listarUsuarios(pageNumber, limitNumber);

    const totalPages = Math.ceil(totalUsers / limitNumber);

    response.status(200).json({
      users,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    response.status(500).json({ error: (error as Error).message });
  }
}

export async function remover(request: Request, response: Response) {
  try {
    const usuarioResponse = await usuarioRN.deletarUsuarioPorId(request.params.id);
    response.status(200).json(usuarioResponse);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function autenticar(request: Request, response: Response) {
  try {
    const { email, senha } = request.body;

    const autenticarUsuario = new AutenticarUsuario(usuarioPrismaRepository);
    const usuario = await autenticarUsuario.executar(email, senha);

    response.status(200).json(usuario);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
