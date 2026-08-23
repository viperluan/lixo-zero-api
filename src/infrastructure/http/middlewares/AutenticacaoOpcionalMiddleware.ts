import { NextFunction, Response } from 'express';
import VerificarTokenUsuario from 'src/application/usecases/usuario/VerificarTokenUsuario';
import { UsuarioRequest } from './AutenticacaoMiddleware';

const AutenticacaoOpcionalMiddleware = async (
  request: UsuarioRequest,
  _response: Response,
  next: NextFunction
) => {
  const token = request.headers.authorization?.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const verificarTokenUsuario = new VerificarTokenUsuario();
    const tokenDecodificado = await verificarTokenUsuario.executar({ token });

    request.usuario = tokenDecodificado;
    next();
  } catch {
    next();
  }
};

export default AutenticacaoOpcionalMiddleware;
