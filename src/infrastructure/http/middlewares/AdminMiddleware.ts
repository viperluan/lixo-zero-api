import { NextFunction, Response } from 'express';
import { usuarioEhAdmin } from 'src/shared/utils/usuarioEhAdmin';
import { UsuarioRequest } from './AutenticacaoMiddleware';

const AdminMiddleware = (request: UsuarioRequest, response: Response, next: NextFunction) => {
  if (!request.usuario) {
    return response.status(401).json({ message: 'Usuário não autenticado' });
  }

  if (!usuarioEhAdmin(request.usuario)) {
    return response.status(403).json({ message: 'Acesso negado.' });
  }

  next();
};

export default AdminMiddleware;
