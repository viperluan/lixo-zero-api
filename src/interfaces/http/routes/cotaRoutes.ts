import { Router } from 'express';

import * as cotaController from '../controllers/CotaController';

const cotaRouter = Router();

cotaRouter.post('/', cotaController.criarCota);
cotaRouter.get('/', cotaController.listarTodasCotas);

export default cotaRouter;
