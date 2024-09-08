import { Router } from 'express';

import * as categoriaController from '../controllers/CategoriaController';

const categoriaRouter = Router();

categoriaRouter.post('/', categoriaController.create);
categoriaRouter.get('/', categoriaController.getAll);

export default categoriaRouter;
