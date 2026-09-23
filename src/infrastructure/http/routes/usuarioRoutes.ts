import { Router } from 'express';

import * as usuarioController from '../controllers/UsuarioController';
import AutenticacaoMiddleware from '../middlewares/AutenticacaoMiddleware';
import AdminMiddleware from '../middlewares/AdminMiddleware';
import {
  criarRateLimitAutenticar,
  criarRateLimitCadastroUsuario,
  criarRateLimitRedefinirSenha,
  criarRateLimitSolicitarRedefinicaoSenha,
} from '../config/rateLimit';

const usuarioRouter = Router();

usuarioRouter.post('/', criarRateLimitCadastroUsuario(), usuarioController.criar);
usuarioRouter.get('/', AutenticacaoMiddleware, AdminMiddleware, usuarioController.buscarTodos);
usuarioRouter.delete('/:id', AutenticacaoMiddleware, AdminMiddleware, usuarioController.remover);
usuarioRouter.post('/autenticar', criarRateLimitAutenticar(), usuarioController.autenticar);
usuarioRouter.post(
  '/esqueci-senha',
  criarRateLimitSolicitarRedefinicaoSenha(),
  usuarioController.solicitarRedefinicaoSenha
);
usuarioRouter.post(
  '/redefinir-senha',
  criarRateLimitRedefinirSenha(),
  usuarioController.redefinirSenha
);

export default usuarioRouter;
