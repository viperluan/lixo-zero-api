import { Router } from 'express';

import * as patrocinioController from '../controllers/patrocinador-controller';

const patrocinioRouter = Router();

patrocinioRouter.post('/', patrocinioController.create);
patrocinioRouter.get('/', patrocinioController.getAll);

export default patrocinioRouter;
