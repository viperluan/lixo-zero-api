import { Response } from 'express';
import { prisma } from '@/shared/package/prisma';
import ModeloEmailPrismaRepository from '@/application/repositories/ModeloEmailPrismaRepository';
import BuscarModeloEmail from '@/application/usecases/modeloEmail/BuscarModeloEmail';
import ListarModelosEmail from '@/application/usecases/modeloEmail/ListarModelosEmail';
import PreverModeloEmail from '@/application/usecases/modeloEmail/PreverModeloEmail';
import RestaurarModeloEmail from '@/application/usecases/modeloEmail/RestaurarModeloEmail';
import SalvarModeloEmail from '@/application/usecases/modeloEmail/SalvarModeloEmail';
import {
  codigoModeloEmail,
  ERRO_MODELO_EMAIL_NAO_ENCONTRADO,
} from '@/domain/modeloEmail/modeloEmail';
import { UsuarioRequest } from '../middlewares/AutenticacaoMiddleware';
import { responderErroInterno } from '@/shared/utils/responderErroInterno';

const modeloEmailRepository = new ModeloEmailPrismaRepository(prisma);

function responderErroModelo(response: Response, error: unknown) {
  const mensagem = (error as Error).message;

  if (mensagem === ERRO_MODELO_EMAIL_NAO_ENCONTRADO) {
    return response.status(404).json({ error: mensagem });
  }

  return response.status(400).json({ error: mensagem });
}

function codigoDaRota(request: UsuarioRequest, response: Response) {
  const codigo = codigoModeloEmail(request.params.codigo);
  if (!codigo) {
    response.status(404).json({ error: ERRO_MODELO_EMAIL_NAO_ENCONTRADO });
    return null;
  }

  return codigo;
}

export async function listar(_request: UsuarioRequest, response: Response) {
  try {
    const modelos = await new ListarModelosEmail(modeloEmailRepository).executar();

    response.status(200).json({ templates: modelos });
  } catch (error) {
    responderErroInterno(response, error);
  }
}

export async function buscar(request: UsuarioRequest, response: Response) {
  try {
    const codigo = codigoDaRota(request, response);
    if (!codigo) return;

    const modelo = await new BuscarModeloEmail(modeloEmailRepository).executar(codigo);

    response.status(200).json(modelo);
  } catch (error) {
    responderErroModelo(response, error);
  }
}

export async function salvar(request: UsuarioRequest, response: Response) {
  try {
    if (!request.usuario) {
      return response.status(401).json({ message: 'Usuário não autenticado' });
    }

    const codigo = codigoDaRota(request, response);
    if (!codigo) return;

    const { assunto, conteudo } = request.body ?? {};
    const modelo = await new SalvarModeloEmail(modeloEmailRepository).executar({
      codigo,
      assunto,
      conteudo,
      id_usuario: request.usuario.id,
    });

    response.status(200).json(modelo);
  } catch (error) {
    if (error instanceof Error && !('code' in error)) {
      return responderErroModelo(response, error);
    }

    responderErroInterno(response, error);
  }
}

export async function previa(request: UsuarioRequest, response: Response) {
  try {
    const codigo = codigoDaRota(request, response);
    if (!codigo) return;

    const previaModelo = await new PreverModeloEmail(modeloEmailRepository).executar(codigo);

    response.status(200).json(previaModelo);
  } catch (error) {
    responderErroInterno(response, error);
  }
}

export async function restaurar(request: UsuarioRequest, response: Response) {
  try {
    if (!request.usuario) {
      return response.status(401).json({ message: 'Usuário não autenticado' });
    }

    const codigo = codigoDaRota(request, response);
    if (!codigo) return;

    const modelo = await new RestaurarModeloEmail(modeloEmailRepository).executar({
      codigo,
      id_usuario: request.usuario.id,
    });

    response.status(200).json(modelo);
  } catch (error) {
    responderErroInterno(response, error);
  }
}
