import { Router } from 'express';

import * as categoriaController from '../controllers/CategoriaController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';
import AdminMiddleware from '../middlewares/AdminMiddleware';
import { criarRateLimitLeituraPublica } from '../config/rateLimit';

const categoriaRouter = Router();

categoriaRouter.post('/', AutenticacaoMiddleware, AdminMiddleware, categoriaController.criar);
categoriaRouter.get('/', criarRateLimitLeituraPublica(), categoriaController.buscarTodas);

export default categoriaRouter;
