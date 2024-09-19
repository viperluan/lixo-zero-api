import { NextFunction, Response } from 'express';
import { UsuarioRequest } from './AutenticacaoMiddleware';

const AdminMiddleware = (request: UsuarioRequest, response: Response, next: NextFunction) => {
  if (!request.usuario) {
    return response.status(401).json({ message: 'Usuário não autenticado' });
  }

  if (request.usuario.tipo !== '0') {
    return response.status(403).json({ message: 'Acesso negado.' });
  }

  next();
};

export default AdminMiddleware;
