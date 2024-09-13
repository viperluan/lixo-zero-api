import { Router } from 'express';

import categoriaRouter from './categoriaRoutes';
import usuarioRouter from './usuarioRoutes';
import acaoRouter from './acaoRoutes';
import patrocinioRouter from './patrocinioRoutes';
import cotaRouter from './cotaRoutes';

const routes = Router();

routes.use('/categorias', categoriaRouter);
routes.use('/usuarios', usuarioRouter);
routes.use('/acoes', acaoRouter);
routes.use('/patrocinio', patrocinioRouter);
routes.use('/cota', cotaRouter);

export default routes;
