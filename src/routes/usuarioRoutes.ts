import { Router } from 'express';

import * as usuarioController from '../controllers/UsuarioController';

const usuarioRouter = Router();

usuarioRouter.post('/', usuarioController.criar);
usuarioRouter.get('/', usuarioController.buscarTodos);
usuarioRouter.delete('/:id', usuarioController.remover);
usuarioRouter.post('/autenticar', usuarioController.autenticar);

export default usuarioRouter;
