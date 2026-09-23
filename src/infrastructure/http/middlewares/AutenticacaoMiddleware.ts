import { NextFunction, Request, Response } from 'express';
import VerificarTokenUsuario, {
  ERRO_TOKEN_EXPIRADO,
} from '@/application/usecases/usuario/VerificarTokenUsuario';
import UsuarioPrismaRepository from '@/application/repositories/UsuarioPrismaRepository';
import { prisma } from '@/shared/package/prisma';
import { UsuarioAutenticado } from '@/shared/types/UsuarioAutenticado';
import { responderErroInterno } from '@/shared/utils/responderErroInterno';

export type UsuarioRequest = Request & {
  usuario?: UsuarioAutenticado;
};

export type ResultadoCarregarUsuarioAutenticado =
  | { autenticado: true; usuario: UsuarioAutenticado }
  | { autenticado: false; motivo: 'token_expirado' | 'sessao_invalida' };

const usuarioRepository = new UsuarioPrismaRepository(prisma);

/**
 * Resolve o usuário a partir do token consultando o banco, de modo que
 * desativação, rebaixamento, exclusão e troca de senha tenham efeito imediato.
 *
 * Falhas de verificação do JWT e contas inutilizáveis viram resultado
 * discriminado. Falhas de infraestrutura são propagadas para não virarem 401.
 */
export async function carregarUsuarioAutenticado(
  token: string
): Promise<ResultadoCarregarUsuarioAutenticado> {
  let idUsuario: string;
  let emitidoEm: number;

  try {
    const verificarTokenUsuario = new VerificarTokenUsuario();
    const tokenDecodificado = await verificarTokenUsuario.executar({ token });

    idUsuario = tokenDecodificado.id;
    emitidoEm = tokenDecodificado.iat;
  } catch (error) {
    if ((error as Error).message === ERRO_TOKEN_EXPIRADO) {
      return { autenticado: false, motivo: 'token_expirado' };
    }

    return { autenticado: false, motivo: 'sessao_invalida' };
  }

  const usuario = await usuarioRepository.buscarPorId(idUsuario);
  const senhaTrocadaDepoisDoToken = usuario
    ? tokenEmitidoAntesDaTrocaDeSenha(emitidoEm, usuario.senha_alterada_em)
    : false;

  if (!usuario || !usuario.status || senhaTrocadaDepoisDoToken) {
    return { autenticado: false, motivo: 'sessao_invalida' };
  }

  return {
    autenticado: true,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
    },
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
    const resultado = await carregarUsuarioAutenticado(token);

    if (!resultado.autenticado) {
      if (resultado.motivo === 'token_expirado') {
        return response.status(401).json({ message: 'Sessão inválida.', code: 'TOKEN_EXPIRED' });
      }

      return response.status(401).json({ message: 'Sessão inválida.' });
    }

    request.usuario = resultado.usuario;

    next();
  } catch (error) {
    responderErroInterno(response, error);
  }
};

export default AutenticacaoMiddleware;

function tokenEmitidoAntesDaTrocaDeSenha(emitidoEm: number, senhaAlteradaEm: Date | null): boolean {
  if (!senhaAlteradaEm) return false;
  if (typeof emitidoEm !== 'number') return true;

  return emitidoEm < Math.floor(senhaAlteradaEm.getTime() / 1000);
}
