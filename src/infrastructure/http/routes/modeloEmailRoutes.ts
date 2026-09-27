import { Router } from 'express';

import * as modeloEmailController from '../controllers/ModeloEmailController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';
import AdminMiddleware from '../middlewares/AdminMiddleware';

const modeloEmailRouter = Router();

modeloEmailRouter.get('/', AutenticacaoMiddleware, AdminMiddleware, modeloEmailController.listar);
modeloEmailRouter.get(
  '/:codigo',
  AutenticacaoMiddleware,
  AdminMiddleware,
  modeloEmailController.buscar
);
modeloEmailRouter.put(
  '/:codigo',
  AutenticacaoMiddleware,
  AdminMiddleware,
  modeloEmailController.salvar
);
modeloEmailRouter.post(
  '/:codigo/previa',
  AutenticacaoMiddleware,
  AdminMiddleware,
  modeloEmailController.previa
);
modeloEmailRouter.post(
  '/:codigo/restaurar',
  AutenticacaoMiddleware,
  AdminMiddleware,
  modeloEmailController.restaurar
);

export default modeloEmailRouter;
