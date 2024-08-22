import { Router } from 'express';

import * as usuarioController from '../controllers/usuario-controller';

const usuarioRouter = Router();

usuarioRouter.post('/', usuarioController.create);
usuarioRouter.get('/', usuarioController.getAll);
usuarioRouter.delete('/:id', usuarioController.remove);
usuarioRouter.post('/autenticar', usuarioController.auth);

export default usuarioRouter;
