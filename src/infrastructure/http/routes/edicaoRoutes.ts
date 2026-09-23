import { Router } from 'express';

import * as edicaoController from '../controllers/EdicaoController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';
import AdminMiddleware from '../middlewares/AdminMiddleware';
import { criarRateLimitLeituraPublica } from '../config/rateLimit';

const edicaoRouter = Router();

edicaoRouter.get('/vigente', criarRateLimitLeituraPublica(), edicaoController.obterVigente);
edicaoRouter.get('/', AutenticacaoMiddleware, AdminMiddleware, edicaoController.listar);
edicaoRouter.get('/:id', AutenticacaoMiddleware, AdminMiddleware, edicaoController.buscar);
edicaoRouter.post('/', AutenticacaoMiddleware, AdminMiddleware, edicaoController.criar);
edicaoRouter.put(
  '/:id/prorrogar',
  AutenticacaoMiddleware,
  AdminMiddleware,
  edicaoController.prorrogar
);
edicaoRouter.put(
  '/:id/inscricoes',
  AutenticacaoMiddleware,
  AdminMiddleware,
  edicaoController.alterarInscricoes
);
edicaoRouter.put(
  '/:id/vigente',
  AutenticacaoMiddleware,
  AdminMiddleware,
  edicaoController.tornarVigente
);
edicaoRouter.put('/:id', AutenticacaoMiddleware, AdminMiddleware, edicaoController.atualizar);
edicaoRouter.delete('/:id', AutenticacaoMiddleware, AdminMiddleware, edicaoController.remover);

export default edicaoRouter;
