import { Router } from 'express';

import * as acaoController from '../controllers/AcaoController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';
import AutenticacaoOpcionalMiddleware from '../middlewares/AutenticacaoOpcionalMiddleware';
import AdminMiddleware from '../middlewares/AdminMiddleware';
import { criarRateLimitLeituraPublica, criarRateLimitPlanilhaAcoes } from '../config/rateLimit';

const acaoRouter = Router();

acaoRouter.post('/', AutenticacaoMiddleware, acaoController.criarAcao);
acaoRouter.get(
  '/',
  criarRateLimitLeituraPublica(),
  AutenticacaoOpcionalMiddleware,
  acaoController.listarTodasAcoes
);
acaoRouter.get('/minhas', AutenticacaoMiddleware, acaoController.listarMinhasAcoes);
acaoRouter.get(
  '/planilha',
  criarRateLimitPlanilhaAcoes(),
  AutenticacaoMiddleware,
  AdminMiddleware,
  acaoController.exportarPlanilhaAcoes
);
acaoRouter.get('/:data', AutenticacaoMiddleware, acaoController.listarPorData);
acaoRouter.get(
  '/:dataInicial/:dataFinal',
  AutenticacaoMiddleware,
  acaoController.listarPorIntervaloData
);
acaoRouter.put('/:id', AutenticacaoMiddleware, AdminMiddleware, acaoController.atualizarAcao);

export default acaoRouter;
