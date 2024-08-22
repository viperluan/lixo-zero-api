import { Router } from 'express';

import * as acaoController from '../controllers/acao-controller';

const acaoRouter = Router();

acaoRouter.post('/', acaoController.create);
acaoRouter.get('/', acaoController.getAll);
acaoRouter.get('/:data', acaoController.buscarPorData);
acaoRouter.get('/:dataInicial/:dataFinal', acaoController.buscarPorIntervaloData);
acaoRouter.put('/:id', acaoController.update);

export default acaoRouter;
