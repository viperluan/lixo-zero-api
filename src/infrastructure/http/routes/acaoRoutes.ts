import { Router } from 'express';

import * as acaoController from '../controllers/AcaoController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';
import AutenticacaoOpcionalMiddleware from '../middlewares/AutenticacaoOpcionalMiddleware';
import AdminMiddleware from '../middlewares/AdminMiddleware';
import { criarRateLimitLeituraPublica } from '../config/rateLimit';

const acaoRouter = Router();

acaoRouter.post('/', AutenticacaoMiddleware, acaoController.criarAcao);
acaoRouter.get(
  '/',
  criarRateLimitLeituraPublica(),
  AutenticacaoOpcionalMiddleware,
  acaoController.listarTodasAcoes
);
acaoRouter.get('/minhas', AutenticacaoMiddleware, acaoController.listarMinhasAcoes);
acaoRouter.get('/:data', AutenticacaoMiddleware, acaoController.listarPorData);
acaoRouter.get(
  '/:dataInicial/:dataFinal',
  AutenticacaoMiddleware,
  acaoController.listarPorIntervaloData
);
acaoRouter.put('/:id', AutenticacaoMiddleware, AdminMiddleware, acaoController.atualizarAcao);

export default acaoRouter;
