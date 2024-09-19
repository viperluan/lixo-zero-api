import { Router } from 'express';

import * as patrocinioController from '../controllers/PatrocinadorController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';

const patrocinioRouter = Router();

patrocinioRouter.post('/', AutenticacaoMiddleware, patrocinioController.criar);
patrocinioRouter.get('/', AutenticacaoMiddleware, patrocinioController.buscarTodos);

export default patrocinioRouter;
