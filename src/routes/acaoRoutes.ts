import { Router } from 'express';

import * as acaoController from '../controllers/acao-controller';

const acaoRouter = Router();

acaoRouter.post('/', acaoController.criarAcao);
acaoRouter.get('/', acaoController.listarTodasAcoes);
acaoRouter.get('/:data', acaoController.listarPorData);
acaoRouter.get('/:dataInicial/:dataFinal', acaoController.listarPorIntervaloData);
acaoRouter.put('/:id', acaoController.atualizarAcao);

export default acaoRouter;
