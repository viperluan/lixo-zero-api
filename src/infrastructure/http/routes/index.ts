import { Router } from 'express';

import categoriaRouter from './categoriaRoutes';
import usuarioRouter from './usuarioRoutes';
import acaoRouter from './acaoRoutes';

const routes = Router();

routes.use('/categorias', categoriaRouter);
routes.use('/usuarios', usuarioRouter);
routes.use('/acoes', acaoRouter);

export default routes;
