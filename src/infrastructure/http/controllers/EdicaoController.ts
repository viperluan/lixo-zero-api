import { Response } from 'express';
import { prisma } from '@/shared/package/prisma';
import EdicaoPrismaRepository from '@/application/repositories/EdicaoPrismaRepository';
import AlterarInscricoesEdicao from '@/application/usecases/edicao/AlterarInscricoesEdicao';
import AtualizarEdicao from '@/application/usecases/edicao/AtualizarEdicao';
import BuscarEdicao from '@/application/usecases/edicao/BuscarEdicao';
import CriarEdicao from '@/application/usecases/edicao/CriarEdicao';
import ListarEdicoes from '@/application/usecases/edicao/ListarEdicoes';
import ObterEdicaoVigente from '@/application/usecases/edicao/ObterEdicaoVigente';
import ProrrogarEdicao from '@/application/usecases/edicao/ProrrogarEdicao';
import TornarEdicaoVigente from '@/application/usecases/edicao/TornarEdicaoVigente';
import { ERRO_EDICAO_NAO_ENCONTRADA, ERRO_EDICAO_VIGENTE_AUSENTE } from '@/domain/edicao/erros';
import { UsuarioRequest } from '../middlewares/AutenticacaoMiddleware';
import { responderErroInterno } from '@/shared/utils/responderErroInterno';

const edicaoPrismaRepository = new EdicaoPrismaRepository(prisma);

function responderErroEdicao(response: Response, error: unknown) {
  const mensagem = (error as Error).message;

  if (mensagem === ERRO_EDICAO_NAO_ENCONTRADA || mensagem === ERRO_EDICAO_VIGENTE_AUSENTE) {
    return response.status(404).json({ error: mensagem });
  }

  return response.status(400).json({ error: mensagem });
}

export async function obterVigente(_request: UsuarioRequest, response: Response) {
  try {
    const obterEdicaoVigente = new ObterEdicaoVigente(edicaoPrismaRepository);
    const edicao = await obterEdicaoVigente.executar();

    response.status(200).json(edicao);
  } catch (error) {
    if ((error as Error).message === ERRO_EDICAO_VIGENTE_AUSENTE) {
      return responderErroEdicao(response, error);
    }

    responderErroInterno(response, error);
  }
}

export async function listar(_request: UsuarioRequest, response: Response) {
  try {
    const listarEdicoes = new ListarEdicoes(edicaoPrismaRepository);
    const edicoes = await listarEdicoes.executar();

    response.status(200).json(edicoes);
  } catch (error) {
    responderErroInterno(response, error);
  }
}

export async function buscar(request: UsuarioRequest, response: Response) {
  try {
    const buscarEdicao = new BuscarEdicao(edicaoPrismaRepository);
    const edicao = await buscarEdicao.executar({ id: request.params.id });

    response.status(200).json(edicao);
  } catch (error) {
    if ((error as Error).message === ERRO_EDICAO_NAO_ENCONTRADA) {
      return responderErroEdicao(response, error);
    }

    responderErroInterno(response, error);
  }
}

export async function criar(request: UsuarioRequest, response: Response) {
  try {
    const {
      ano,
      data_inicio_cadastro,
      data_fim_cadastro,
      data_inicio_realizacao,
      data_fim_realizacao,
      inscricoes_abertas,
      vigente,
    } = request.body;

    const criarEdicao = new CriarEdicao(edicaoPrismaRepository);
    const edicao = await criarEdicao.executar({
      ano,
      data_inicio_cadastro,
      data_fim_cadastro,
      data_inicio_realizacao,
      data_fim_realizacao,
      inscricoes_abertas,
      vigente,
    });

    response.status(201).json(edicao);
  } catch (error) {
    responderErroEdicao(response, error);
  }
}

export async function prorrogar(request: UsuarioRequest, response: Response) {
  try {
    if (!request.usuario) {
      return response
        .status(401)
        .json({ message: 'Autenticação necessária para acessar o recurso.' });
    }

    const { data_fim_cadastro } = request.body;
    const prorrogarEdicao = new ProrrogarEdicao(edicaoPrismaRepository);
    const edicao = await prorrogarEdicao.executar({
      id: request.params.id,
      data_fim_cadastro,
      id_usuario: request.usuario.id,
    });

    response.status(200).json(edicao);
  } catch (error) {
    responderErroEdicao(response, error);
  }
}

export async function alterarInscricoes(request: UsuarioRequest, response: Response) {
  try {
    const { inscricoes_abertas } = request.body;
    const alterarInscricoesEdicao = new AlterarInscricoesEdicao(edicaoPrismaRepository);
    const edicao = await alterarInscricoesEdicao.executar({
      id: request.params.id,
      inscricoes_abertas,
    });

    response.status(200).json(edicao);
  } catch (error) {
    responderErroEdicao(response, error);
  }
}

export async function tornarVigente(request: UsuarioRequest, response: Response) {
  try {
    const tornarEdicaoVigente = new TornarEdicaoVigente(edicaoPrismaRepository);
    const edicao = await tornarEdicaoVigente.executar({ id: request.params.id });

    response.status(200).json(edicao);
  } catch (error) {
    responderErroEdicao(response, error);
  }
}

export async function atualizar(request: UsuarioRequest, response: Response) {
  try {
    const { data_inicio_cadastro, data_fim_cadastro, data_inicio_realizacao, data_fim_realizacao } =
      request.body;

    const atualizarEdicao = new AtualizarEdicao(edicaoPrismaRepository);
    const edicao = await atualizarEdicao.executar({
      id: request.params.id,
      data_inicio_cadastro,
      data_fim_cadastro,
      data_inicio_realizacao,
      data_fim_realizacao,
    });

    response.status(200).json(edicao);
  } catch (error) {
    responderErroEdicao(response, error);
  }
}
