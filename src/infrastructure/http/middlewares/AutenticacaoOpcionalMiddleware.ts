import { NextFunction, Response } from 'express';
import { carregarUsuarioAutenticado, UsuarioRequest } from './AutenticacaoMiddleware';

const AutenticacaoOpcionalMiddleware = async (
  request: UsuarioRequest,
  _response: Response,
  next: NextFunction
) => {
  const token = request.headers.authorization?.split(' ')[1];

  if (!token) {
    return next();
  }

  const usuario = await carregarUsuarioAutenticado(token).catch(() => null);

  if (usuario) {
    request.usuario = usuario;
  }

  next();
};

export default AutenticacaoOpcionalMiddleware;
