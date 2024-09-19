import { Router } from 'express';

import * as cotaController from '../controllers/CotaController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';
import AdminMiddleware from '../middlewares/AdminMiddleware';

const cotaRouter = Router();

cotaRouter.post('/', AutenticacaoMiddleware, AdminMiddleware, cotaController.criarCota);
cotaRouter.get('/', AutenticacaoMiddleware, cotaController.listarTodasCotas);

export default cotaRouter;
