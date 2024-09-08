import { Router } from 'express';

import * as cotaController from '../controllers/CotaController';

const cotaRouter = Router();

cotaRouter.post('/', cotaController.create);
cotaRouter.get('/', cotaController.getAll);

export default cotaRouter;
