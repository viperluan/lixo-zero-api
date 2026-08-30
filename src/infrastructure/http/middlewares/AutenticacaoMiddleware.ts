import { NextFunction, Request, Response } from 'express';
import VerificarTokenUsuario from '../../../application/usecases/usuario/VerificarTokenUsuario';
import UsuarioPrismaRepository from '../../../application/repositories/UsuarioPrismaRepository';
import { prisma } from '../../../shared/package/prisma';
import { UsuarioAutenticado } from '../../../shared/types/UsuarioAutenticado';
import { responderErroInterno } from '../../../shared/utils/responderErroInterno';

export type UsuarioRequest = Request & {
  usuario?: UsuarioAutenticado;
};

const usuarioRepository = new UsuarioPrismaRepository(prisma);

/**
 * Resolve o usuário a partir do token consultando o banco, de modo que
 * desativação, rebaixamento e exclusão tenham efeito imediato.
 *
 * Retorna `null` quando o token é inválido ou a conta não pode mais ser usada.
 * Falhas de infraestrutura são propagadas para não virarem 401.
 */
export async function carregarUsuarioAutenticado(
  token: string
): Promise<UsuarioAutenticado | null> {
  let idUsuario: string;

  try {
    const verificarTokenUsuario = new VerificarTokenUsuario();
    const tokenDecodificado = await verificarTokenUsuario.executar({ token });

    idUsuario = tokenDecodificado.id;
  } catch {
    return null;
  }

  const usuario = await usuarioRepository.buscarPorId(idUsuario);

  if (!usuario || !usuario.status) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
  };
}

const AutenticacaoMiddleware = async (
  request: UsuarioRequest,
  response: Response,
  next: NextFunction
) => {
  const token = request.headers.authorization?.split(' ')[1];

  if (!token) {
    return response
      .status(401)
      .json({ message: 'Autenticação necessária para acessar o recurso.' });
  }

  try {
    const usuario = await carregarUsuarioAutenticado(token);

    if (!usuario) {
      return response.status(401).json({ message: 'Sessão inválida.' });
    }

    request.usuario = usuario;

    next();
  } catch (error) {
    responderErroInterno(response, error);
  }
};

export default AutenticacaoMiddleware;
