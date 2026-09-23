import { prisma } from '@/shared/package/prisma';
import { Request, Response } from 'express';

import UsuarioPrismaRepository from '@/application/repositories/UsuarioPrismaRepository';
import RedefinicaoSenhaPrismaRepository from '@/application/repositories/RedefinicaoSenhaPrismaRepository';
import CriarUsuario from '@/application/usecases/usuario/CriarUsuario';
import AutenticarUsuario from '@/application/usecases/usuario/AutenticarUsuario';
import DeletarUsuario, {
  ERRO_USUARIO_NAO_EXISTE,
  ERRO_USUARIO_VINCULADO_A_ACOES,
} from '@/application/usecases/usuario/DeletarUsuario';
import ListarUsuarios from '@/application/usecases/usuario/ListarUsuarios';
import GerarTokenUsuario from '@/application/usecases/usuario/GerarTokenUsuario';
import SolicitarRedefinicaoSenha, {
  MENSAGEM_SOLICITACAO_REDEFINICAO_SENHA,
} from '@/application/usecases/usuario/SolicitarRedefinicaoSenha';
import RedefinirSenha, {
  ERRO_LINK_REDEFINICAO_SENHA,
  ERRO_TAMANHO_SENHA_REDEFINICAO,
  MENSAGEM_SENHA_REDEFINIDA,
} from '@/application/usecases/usuario/RedefinirSenha';
import FilaEmailService from '@/application/services/email/FilaEmailService';
import { filaEmail } from '@/infrastructure/fila/filaEmail';
import { normalizarPaginacao } from '@/shared/utils/normalizarPaginacao';
import { responderErroInterno } from '@/shared/utils/responderErroInterno';

const usuarioPrismaRepository = new UsuarioPrismaRepository(prisma);
const redefinicaoSenhaRepository = new RedefinicaoSenhaPrismaRepository(prisma);
const filaEmailService = new FilaEmailService(filaEmail);

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
    const mensagem = (error as Error).message;

    if (mensagem === ERRO_USUARIO_NAO_EXISTE) {
      return response.status(404).json({ error: mensagem });
    }

    if (mensagem === ERRO_USUARIO_VINCULADO_A_ACOES) {
      return response.status(409).json({ error: mensagem });
    }

    responderErroInterno(response, error);
  }
}

export async function solicitarRedefinicaoSenha(request: Request, response: Response) {
  try {
    const { email } = request.body ?? {};
    const solicitar = new SolicitarRedefinicaoSenha(
      usuarioPrismaRepository,
      redefinicaoSenhaRepository,
      filaEmailService
    );

    await solicitar.executar({ email });

    response.status(200).json({ message: MENSAGEM_SOLICITACAO_REDEFINICAO_SENHA });
  } catch (error) {
    responderErroInterno(response, error);
  }
}

export async function redefinirSenha(request: Request, response: Response) {
  try {
    const { token, senha } = request.body ?? {};
    const redefinir = new RedefinirSenha(
      usuarioPrismaRepository,
      redefinicaoSenhaRepository,
      filaEmailService
    );

    await redefinir.executar({ token, senha });

    response.status(200).json({ message: MENSAGEM_SENHA_REDEFINIDA });
  } catch (error) {
    const mensagem = (error as Error).message;

    if (mensagem === ERRO_LINK_REDEFINICAO_SENHA || mensagem === ERRO_TAMANHO_SENHA_REDEFINICAO) {
      return response.status(400).json({ error: mensagem });
    }

    responderErroInterno(response, error);
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
