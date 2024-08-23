import { Request, Response } from 'express';
import UsuarioPrismaRepository from '../application/repositories/UsuarioPrismaRepository';
import CriarUsuario from '../application/usecases/CriarUsuario';

const usuarioPrismaRepository = new UsuarioPrismaRepository();

export async function create(request: Request, response: Response) {
  try {
    const { nome, email, senha, cpf_cnpj } = request.body;

    const criarUsuario = new CriarUsuario(usuarioPrismaRepository);
    await criarUsuario.executar({ nome, email, senha, cpf_cnpj });

    response.status(201).end();
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getAll(request: Request, response: Response) {
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
    response.status(500).json({ error: error.message });
  }
}

export async function remove(request: Request, response: Response) {
  try {
    const usuarioResponse = await usuarioRN.deletarUsuarioPorId(request.params.id);
    response.status(200).json(usuarioResponse);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
}

export async function auth(request: Request, response: Response) {
  try {
    const usuarioResponse = await usuarioRN.buscarPorLogin(request.body);
    response.status(200).json(usuarioResponse);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
}
