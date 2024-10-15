import { Router } from 'express';

import * as categoriaController from '../controllers/CategoriaController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';
import AdminMiddleware from '../middlewares/AdminMiddleware';

const categoriaRouter = Router();

categoriaRouter.post('/', AutenticacaoMiddleware, AdminMiddleware, categoriaController.criar);
categoriaRouter.get('/', categoriaController.buscarTodas);

export default categoriaRouter;
