import { Request, Response } from 'express';
import { prisma } from '../package/prisma';
import PatrocinadorPrismaRepository from '../application/repositories/PatrocinadorPrismaRepository';
import CriarPatrocinador from '../application/usecases/patrocinador/CriarPatrocinador';
import ListarPatrocinadores from '../application/usecases/patrocinador/ListarPatrocinadores';

const patrocinadorPrismaRepository = new PatrocinadorPrismaRepository(prisma);

export async function criar(request: Request, response: Response) {
  try {
    const { id_usuario_responsavel, celular, nome, descricao, id_cota, situacao } = request.body;

    const criarPatrocinador = new CriarPatrocinador(patrocinadorPrismaRepository);
    await criarPatrocinador.executar({
      nome,
      celular,
      descricao,
      situacao,
      id_cota,
      id_usuario: id_usuario_responsavel,
    });

    response.status(201).end();
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function buscarTodos(request: Request, response: Response) {
  try {
    const { page = 1, limit = 10 } = request.query;

    const paginaAtual = Number(page);
    const limiteDePatrocinadoresPorPagina = Number(limit);

    const listarPatrocinadores = new ListarPatrocinadores(patrocinadorPrismaRepository);
    const { patrocinadores, totalDePaginas } = await listarPatrocinadores.executar({
      paginaAtual,
      limiteDePatrocinadoresPorPagina,
    });

    response.status(200).json({
      partnes: patrocinadores,
      totalPages: totalDePaginas,
      currentPage: paginaAtual,
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
