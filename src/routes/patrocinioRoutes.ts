import { Router } from 'express';

import * as patrocinioController from '../controllers/PatrocinadorController';

const patrocinioRouter = Router();

patrocinioRouter.post('/', patrocinioController.create);
patrocinioRouter.get('/', patrocinioController.getAll);

export default patrocinioRouter;
