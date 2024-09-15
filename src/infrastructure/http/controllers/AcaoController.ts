import { prisma } from '../../../shared/package/prisma';
import { Request, Response } from 'express';
import AcaoPrismaRepository from '../../../application/repositories/AcaoPrismaRepository';
import CriarAcao from '../../../application/usecases/acao/CriarAcao';
import ListarAcoes from '../../../application/usecases/acao/ListarAcoes';
import AtualizarAcao from '../../../application/usecases/acao/AtualizarAcao';
import ListarAcoesPorData from '../../../application/usecases/acao/ListarAcoesPorData';
import ListarAcoesPorIntervaloData from '../../../application/usecases/acao/ListarAcoesPorIntervaloData';
import UsuarioPrismaRepository from '../../../application/repositories/UsuarioPrismaRepository';
import NodemailerService from '../../../application/services/email/NodemailerService';
import { transportador } from '../../../shared/package/nodemailer';

const acaoPrismaRepository = new AcaoPrismaRepository(prisma);
const usuarioPrismaRepository = new UsuarioPrismaRepository(prisma);
const nodemailerService = new NodemailerService(transportador);

export async function listarTodasAcoes(request: Request, response: Response) {
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

export async function criarAcao(request: Request, response: Response) {
  try {
    const dados = request.body;

    const criarAcao = new CriarAcao(
      acaoPrismaRepository,
      usuarioPrismaRepository,
      nodemailerService
    );

    const acao = await criarAcao.executar(dados);

    response.status(201).json(acao);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function atualizarAcao(request: Request, response: Response) {
  try {
    const { id } = request.params;
    const campos = request.body;

    const atualizarAcao = new AtualizarAcao(acaoPrismaRepository);
    const acao = await atualizarAcao.executar({ id, campos });

    response.status(200).json(acao);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function listarPorData(request: Request, response: Response) {
  try {
    const { data } = request.params;

    const listarPorData = new ListarAcoesPorData(acaoPrismaRepository);
    const acoes = await listarPorData.executar({ data });

    response.status(200).json(acoes);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function listarPorIntervaloData(request: Request, response: Response) {
  try {
    const { dataInicial, dataFinal } = request.params;

    const listarAcoesPorIntervaloData = new ListarAcoesPorIntervaloData(acaoPrismaRepository);
    const acoes = await listarAcoesPorIntervaloData.executar({ dataInicial, dataFinal });

    response.status(200).json(acoes);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
