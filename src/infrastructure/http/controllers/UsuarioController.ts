import { prisma } from '../../../shared/package/prisma';
import { Request, Response } from 'express';

import UsuarioPrismaRepository from '../../../application/repositories/UsuarioPrismaRepository';
import CriarUsuario from '../../../application/usecases/usuario/CriarUsuario';
import AutenticarUsuario from '../../../application/usecases/usuario/AutenticarUsuario';
import DeletarUsuario from '../../../application/usecases/usuario/DeletarUsuario';
import ListarUsuarios from '../../../application/usecases/usuario/ListarUsuarios';
import GerarTokenUsuario from '../../../application/usecases/usuario/GerarTokenUsuario';
import { normalizarPaginacao } from '../../../shared/utils/normalizarPaginacao';

const usuarioPrismaRepository = new UsuarioPrismaRepository(prisma);

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
    const { paginaAtual, limite: limiteDeUsuariosPorPagina } = normalizarPaginacao(page, limit);

    const listarUsuarios = new ListarUsuarios(usuarioPrismaRepository);

    const {
      usuarios,
      paginaAtual: paginaRetornada,
      totalDePaginas,
    } = await listarUsuarios.executar({
      paginaAtual,
      limiteDeUsuariosPorPagina,
    });

    response.status(200).json({
      users: usuarios,
      totalPages: totalDePaginas,
      currentPage: paginaRetornada,
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function remover(request: Request, response: Response) {
  try {
    const { id } = request.params;

    const deletarUsuario = new DeletarUsuario(usuarioPrismaRepository);
    await deletarUsuario.executar({ id });

    response.status(200).end();
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function autenticar(request: Request, response: Response) {
  try {
    const { email, senha } = request.body;

    const gerarTokenUsuario = new GerarTokenUsuario();
    const autenticarUsuario = new AutenticarUsuario(usuarioPrismaRepository, gerarTokenUsuario);
    const usuario = await autenticarUsuario.executar({ email, senha });

    response.status(200).json(usuario);
  } catch (error) {
    const mensagem = (error as Error).message;

    if (mensagem === 'Email ou senha incorretos') {
      return response.status(401).json({ error: mensagem });
    }

    response.status(400).json({ error: mensagem });
  }
}
