/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import VerificarTokenUsuario, {
  TokenDecodificado,
} from 'src/application/usecases/usuario/VerificarTokenUsuario';

export type UsuarioRequest = Request & {
  usuario?: TokenDecodificado;
};

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
    const verificarTokenUsuario = new VerificarTokenUsuario();
    const tokenDecodificado = await verificarTokenUsuario.executar({ token });

    if (token) request.usuario = tokenDecodificado;

    next();
  } catch (error) {
    return response.status(401).json({ message: 'Token inválido.' });
  }
};

export default AutenticacaoMiddleware;
