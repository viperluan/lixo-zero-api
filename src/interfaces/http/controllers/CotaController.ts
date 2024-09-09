import { Request, Response } from 'express';
import { prisma } from '../package/prisma';
import CotaPrismaRepository from '../application/repositories/CotaPrismaRepository';

import CriarCota from '../application/usecases/cota/CriarCota';
import ListarCotas from '../application/usecases/cota/ListarCotas';

const cotaPrismaRepository = new CotaPrismaRepository(prisma);

export async function criarCota(request: Request, response: Response) {
  try {
    const { descricao } = request.body;

    const criarCota = new CriarCota(cotaPrismaRepository);
    const cota = await criarCota.executar({ descricao });

    response.status(201).json(cota);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function listarTodasCotas(request: Request, response: Response) {
  try {
    const { page = 1, limit = 10 } = request.query;

    const paginaAtual = Number(page);
    const limiteDeCotasPorPagina = Number(limit);

    const listarCotas = new ListarCotas(cotaPrismaRepository);
    const { cotas, totalDePaginas } = await listarCotas.executar({
      paginaAtual,
      limiteDeCotasPorPagina,
    });

    response.status(200).json({
      quotas: cotas,
      totalPages: totalDePaginas,
      currentPage: paginaAtual,
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
