import { prisma } from '../package/prisma';
import { Request, Response } from 'express';
import AcaoPrismaRepository from '../application/repositories/AcaoPrismaRepository';
import CriarAcao from '../application/usecases/acao/CriarAcao';
import ListarAcoes from '../application/usecases/acao/ListarAcoes';
import { AcaoRN } from '../business/acaoRN';

const acaoPrismaRepository = new AcaoPrismaRepository(prisma);

const acaoRN = new AcaoRN();

export async function getAll(request: Request, response: Response) {
  try {
    const {
      page = 1,
      limit = 10,
      id_categoria,
      id_usuario,
      data_acao,
      search,
      situacao,
      forma_realizacao_acao,
    } = request.query;

    const paginaAtual = Number(page);
    const limiteDeAcoesPorPagina = Number(limit);

    const filtros = {
      id_categoria: (id_categoria as string) || '',
      id_usuario: (id_usuario as string) || '',
      data_acao: (data_acao as string) || '',
      search: (search as string) || '',
      situacao: (situacao as string) || '',
      forma_realizacao_acao: (forma_realizacao_acao as string) || '',
    };

    const listarAcoes = new ListarAcoes(acaoPrismaRepository);
    const { acoes, totalDePaginas } = await listarAcoes.executar({
      filtros,
      limiteDeAcoesPorPagina,
      paginaAtual,
    });

    response.status(200).json({
      actions: acoes,
      totalPages: totalDePaginas,
      currentPage: paginaAtual,
    });
  } catch (error) {
    response.status(500).json({ error: (error as Error).message });
  }
}

export async function create(request: Request, response: Response) {
  try {
    const dados = request.body;

    const criarAcao = new CriarAcao(acaoPrismaRepository);
    const acao = await criarAcao.executar(dados);

    response.status(201).json(acao);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function update(request: Request, response: Response) {
  try {
    const { id } = request.params;
    response.status(201).json(await acaoRN.atualizarAcao(id, request.body));
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
}

export async function buscarPorData(request: Request, response: Response) {
  try {
    const acao = await acaoRN.buscarPorData(request.params.data);
    response.status(200).json(acao);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
}

export async function buscarPorIntervaloData(request: Request, response: Response) {
  console.log(request.params);
  try {
    const acao = await acaoRN.buscarPorIntervaloData(
      request.params.dataInicial,
      request.params.dataFinal
    );
    response.status(200).json(acao);
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
}
