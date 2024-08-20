import express from 'express';
import * as categoriaController from './controllers/categoria-controller.js';
import * as usuarioController from './controllers/usuario-controller.js';
import * as acaoController from './controllers/acao-controller.js';
import * as patrocinioController from './controllers/patrocinador-controller.js';
import * as cotaController from './controllers/cota-controller.js';

const router = express.Router();

// Rotas para categorias
router.post('/categorias', categoriaController.create);
router.get('/categorias', categoriaController.getAll);

// rotas para usuários
router.post('/usuarios', usuarioController.create);
router.get('/usuarios', usuarioController.getAll);
router.delete('/usuarios/:id', usuarioController.remove);
router.post('/usuarios/autenticar', usuarioController.auth);

// rotas para acções
router.post('/acoes', acaoController.create);
router.get('/acoes', acaoController.getAll);
router.get('/acoes/:data', acaoController.buscarPorData);
router.get('/acoes/:dataInicial/:dataFinal', acaoController.buscarPorIntervaloData);
router.put('/acoes/:id', acaoController.update);

// Rotas para Patrocinios
router.post('/patrocinio', patrocinioController.create);
router.get('/patrocinio', patrocinioController.getAll);

// Rotas para Cotas
router.post('/cota', cotaController.create);
router.get('/cota', cotaController.getAll);

export default router;
