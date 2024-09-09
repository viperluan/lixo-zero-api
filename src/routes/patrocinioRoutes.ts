import { Router } from 'express';

import * as patrocinioController from '../controllers/PatrocinadorController';

const patrocinioRouter = Router();

patrocinioRouter.post('/', patrocinioController.criar);
patrocinioRouter.get('/', patrocinioController.buscarTodos);

export default patrocinioRouter;
