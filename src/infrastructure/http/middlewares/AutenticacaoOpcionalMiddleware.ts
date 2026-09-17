import { NextFunction, Response } from 'express';
import { carregarUsuarioAutenticado, UsuarioRequest } from './AutenticacaoMiddleware';

const AutenticacaoOpcionalMiddleware = async (
  request: UsuarioRequest,
  response: Response,
  next: NextFunction
) => {
  const token = request.headers.authorization?.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const resultado = await carregarUsuarioAutenticado(token);

    if (resultado.autenticado) {
      request.usuario = resultado.usuario;
    } else {
      response.setHeader('X-Session-Expired', 'true');
    }
  } catch {
    // Falha de infraestrutura: segue anônimo, sem o header.
  }

  next();
};

export default AutenticacaoOpcionalMiddleware;
