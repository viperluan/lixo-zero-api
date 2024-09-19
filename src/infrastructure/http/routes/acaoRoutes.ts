import { Router } from 'express';

import * as acaoController from '../controllers/AcaoController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';
import AdminMiddleware from '../middlewares/AdminMiddleware';

const acaoRouter = Router();

acaoRouter.post('/', AutenticacaoMiddleware, acaoController.criarAcao);
acaoRouter.get('/', AutenticacaoMiddleware, acaoController.listarTodasAcoes);
acaoRouter.get('/:data', AutenticacaoMiddleware, acaoController.listarPorData);
acaoRouter.get(
  '/:dataInicial/:dataFinal',
  AutenticacaoMiddleware,
  acaoController.listarPorIntervaloData
);
acaoRouter.put('/:id', AutenticacaoMiddleware, AdminMiddleware, acaoController.atualizarAcao);

export default acaoRouter;
