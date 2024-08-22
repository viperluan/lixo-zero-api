import { Router } from 'express';

import * as cotaController from '../controllers/cota-controller';

const cotaRouter = Router();

cotaRouter.post('/', cotaController.create);
cotaRouter.get('/', cotaController.getAll);

export default cotaRouter;
