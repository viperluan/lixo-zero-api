import { prisma } from '../../../shared/package/prisma';
import { Response } from 'express';
import AcaoPrismaRepository from '../../../application/repositories/AcaoPrismaRepository';
import CriarAcao, { CriarAcaoDadosDTO } from '../../../application/usecases/acao/CriarAcao';
import ListarAcoes from '../../../application/usecases/acao/ListarAcoes';
import AtualizarAcao from '../../../application/usecases/acao/AtualizarAcao';
import ListarAcoesPorData from '../../../application/usecases/acao/ListarAcoesPorData';
import ListarAcoesPorIntervaloData from '../../../application/usecases/acao/ListarAcoesPorIntervaloData';
import UsuarioPrismaRepository from '../../../application/repositories/UsuarioPrismaRepository';
import NodemailerService from '../../../application/services/email/NodemailerService';
import { transportador } from '../../../shared/package/nodemailer';
import { UsuarioRequest } from '../middlewares/AutenticacaoMiddleware';
import { AcaoSituacao } from '../../../domain/acao/enum/AcaoSituacao';
import { normalizarPaginacao } from '../../../shared/utils/normalizarPaginacao';
import { responderErroInterno } from '../../../shared/utils/responderErroInterno';
import { usuarioEhAdmin } from '../../../shared/utils/usuarioEhAdmin';

const acaoPrismaRepository = new AcaoPrismaRepository(prisma);
const usuarioPrismaRepository = new UsuarioPrismaRepository(prisma);
const nodemailerService = new NodemailerService(transportador);

function montarOpcoesListagemAcoes(request: UsuarioRequest) {
  const admin = usuarioEhAdmin(request.usuario);

  return {
    admin,
    situacao: admin ? undefined : AcaoSituacao.Aprovada,
    sanitizarSaida: !admin,
  };
}

export async function listarTodasAcoes(request: UsuarioRequest, response: Response) {
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

    const { paginaAtual, limite: limiteDeAcoesPorPagina } = normalizarPaginacao(page, limit);
    const { admin, situacao: situacaoPadrao, sanitizarSaida } = montarOpcoesListagemAcoes(request);

    const filtros = {
      id_categoria: (id_categoria as string) || '',
      id_usuario: (id_usuario as string) || '',
      data_acao: (data_acao as string) || '',
      search: (search as string) || '',
      situacao: admin ? (situacao as string) || '' : situacaoPadrao,
      forma_realizacao_acao: (forma_realizacao_acao as string) || '',
    };

    const listarAcoes = new ListarAcoes(acaoPrismaRepository);
    const { acoes, totalDePaginas } = await listarAcoes.executar({
      filtros,
      limiteDeAcoesPorPagina,
      paginaAtual,
      sanitizarSaida,
    });

    response.status(200).json({
      actions: acoes,
      totalPages: totalDePaginas,
      currentPage: paginaAtual,
    });
  } catch (error) {
    responderErroInterno(response, error);
  }
}

export async function criarAcao(request: UsuarioRequest, response: Response) {
  try {
    if (!request.usuario) {
      return response
        .status(401)
        .json({ message: 'Autenticação necessária para acessar o recurso.' });
    }

    const dados = request.body as CriarAcaoDadosDTO;

    const criarAcao = new CriarAcao(
      acaoPrismaRepository,
      usuarioPrismaRepository,
      nodemailerService
    );

    const acao = await criarAcao.executar({
      ...dados,
      id_usuario_responsavel: request.usuario.id,
    });

    response.status(201).json(acao);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function atualizarAcao(request: UsuarioRequest, response: Response) {
  try {
    const { id } = request.params;
    const campos = request.body;

    const atualizarAcao = new AtualizarAcao(
      acaoPrismaRepository,
      usuarioPrismaRepository,
      nodemailerService
    );

    const acao = await atualizarAcao.executar({ id, campos });

    response.status(200).json(acao);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function listarPorData(request: UsuarioRequest, response: Response) {
  try {
    const { data } = request.params;
    const { situacao: situacaoPadrao, sanitizarSaida } = montarOpcoesListagemAcoes(request);

    const listarPorData = new ListarAcoesPorData(acaoPrismaRepository);
    const acoes = await listarPorData.executar({
      data,
      situacao: situacaoPadrao,
      sanitizarSaida,
    });

    response.status(200).json(acoes);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function listarPorIntervaloData(request: UsuarioRequest, response: Response) {
  try {
    const { dataInicial, dataFinal } = request.params;
    const { situacao: situacaoPadrao, sanitizarSaida } = montarOpcoesListagemAcoes(request);

    const listarAcoesPorIntervaloData = new ListarAcoesPorIntervaloData(acaoPrismaRepository);
    const acoes = await listarAcoesPorIntervaloData.executar({
      dataInicial,
      dataFinal,
      situacao: situacaoPadrao,
      sanitizarSaida,
    });

    response.status(200).json(acoes);
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
