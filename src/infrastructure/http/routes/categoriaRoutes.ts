import { Router } from 'express';

import * as categoriaController from '../controllers/CategoriaController';

const categoriaRouter = Router();

categoriaRouter.post('/', categoriaController.criar);
categoriaRouter.get('/', categoriaController.buscarTodas);

export default categoriaRouter;
