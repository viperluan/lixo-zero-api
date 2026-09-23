import { Router } from 'express';

import categoriaRouter from './categoriaRoutes';
import usuarioRouter from './usuarioRoutes';
import acaoRouter from './acaoRoutes';
import edicaoRouter from './edicaoRoutes';
import healthRouter from './healthRoutes';

const routes = Router();

routes.use('/health', healthRouter);
routes.use('/categorias', categoriaRouter);
routes.use('/usuarios', usuarioRouter);
routes.use('/acoes', acaoRouter);
routes.use('/edicoes', edicaoRouter);

export default routes;
