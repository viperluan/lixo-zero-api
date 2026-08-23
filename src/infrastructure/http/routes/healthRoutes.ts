import { Router } from 'express';

import * as healthController from '../controllers/HealthController';

const healthRouter = Router();

healthRouter.get('/', healthController.verificar);

export default healthRouter;
