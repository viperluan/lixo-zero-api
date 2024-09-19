import { Router } from 'express';

import * as usuarioController from '../controllers/UsuarioController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';
import AdminMiddleware from '../middlewares/AdminMiddleware';

const usuarioRouter = Router();

usuarioRouter.post('/', usuarioController.criar);
usuarioRouter.get('/', AutenticacaoMiddleware, AdminMiddleware, usuarioController.buscarTodos);
usuarioRouter.delete('/:id', AutenticacaoMiddleware, usuarioController.remover);
usuarioRouter.post('/autenticar', usuarioController.autenticar);

export default usuarioRouter;
