import { Router } from 'express';

import * as patrocinioController from '../controllers/patrocinador-controller';

const patrocinioRouter = Router();

patrocinioRouter.post('/patrocinio', patrocinioController.create);
patrocinioRouter.get('/patrocinio', patrocinioController.getAll);

export default patrocinioRouter;
