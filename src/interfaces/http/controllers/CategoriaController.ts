import { Request, Response } from 'express';
import { prisma } from '../package/prisma';
import CriarCategoria from '../application/usecases/categoria/CriarCategoria';
import CategoriaPrismaRepository from '../application/repositories/CategoriaPrismaRepository';
import ListarCategorias from '../application/usecases/categoria/ListarCategorias';

const categoriaPrismaRepository = new CategoriaPrismaRepository(prisma);

export async function criar(request: Request, response: Response) {
  try {
    const { descricao } = request.body;

    const criarCategoria = new CriarCategoria(categoriaPrismaRepository);
    const categoria = await criarCategoria.executar({ descricao });

    response.status(201).json(categoria);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function buscarTodas(request: Request, response: Response) {
  try {
    const { page = 1, limit = 10 } = request.query;

    const paginaAtual = Number(page);
    const limiteDeCategoriasPorPagina = Number(limit);

    const listarCategorias = new ListarCategorias(categoriaPrismaRepository);
    const { categorias, totalDePaginas } = await listarCategorias.executar({
      paginaAtual,
      limiteDeCategoriasPorPagina,
    });

    response.status(200).json({
      categories: categorias,
      totalPages: totalDePaginas,
      currentPage: paginaAtual,
    });
  } catch (error) {
    response.status(500).json({ error: (error as Error).message });
  }
}
