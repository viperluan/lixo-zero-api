import { NextFunction, Request, RequestHandler, Response } from 'express';
import rateLimit from 'express-rate-limit';

const MENSAGEM_LIMITE_EXCEDIDO = {
  message: 'Muitas requisições. Tente novamente mais tarde.',
};

function rateLimitEstaHabilitado(): boolean {
  const valor = process.env.RATE_LIMIT_ENABLED?.trim().toLowerCase();

  return valor !== 'false';
}

function lerNumeroEnv(nome: string, padrao: number): number {
  const valor = process.env[nome]?.trim();

  if (!valor) return padrao;

  const numero = Number(valor);

  return Number.isFinite(numero) && numero > 0 ? numero : padrao;
}

function criarMiddleware(opcoes: Parameters<typeof rateLimit>[0]): RequestHandler {
  if (!rateLimitEstaHabilitado()) {
    return (_request: Request, _response: Response, next: NextFunction) => next();
  }

  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    message: MENSAGEM_LIMITE_EXCEDIDO,
    ...opcoes,
  });
}

export function criarRateLimitGlobal(): RequestHandler {
  return criarMiddleware({
    windowMs: lerNumeroEnv('RATE_LIMIT_GLOBAL_WINDOW_MS', 900_000),
    max: lerNumeroEnv('RATE_LIMIT_GLOBAL_MAX', 200),
    skip: (request) => request.path === '/health',
  });
}

export function criarRateLimitAutenticar(): RequestHandler {
  return criarMiddleware({
    windowMs: lerNumeroEnv('RATE_LIMIT_AUTH_WINDOW_MS', 900_000),
    max: lerNumeroEnv('RATE_LIMIT_AUTH_MAX', 10),
  });
}

export function criarRateLimitCadastroUsuario(): RequestHandler {
  return criarMiddleware({
    windowMs: lerNumeroEnv('RATE_LIMIT_REGISTER_WINDOW_MS', 3_600_000),
    max: lerNumeroEnv('RATE_LIMIT_REGISTER_MAX', 5),
  });
}

export function criarRateLimitSolicitarRedefinicaoSenha(): RequestHandler {
  return criarMiddleware({
    windowMs: lerNumeroEnv('RATE_LIMIT_PASSWORD_RESET_WINDOW_MS', 3_600_000),
    max: lerNumeroEnv('RATE_LIMIT_PASSWORD_RESET_MAX', 5),
  });
}

export function criarRateLimitRedefinirSenha(): RequestHandler {
  return criarMiddleware({
    windowMs: lerNumeroEnv('RATE_LIMIT_PASSWORD_RESET_CONFIRM_WINDOW_MS', 900_000),
    max: lerNumeroEnv('RATE_LIMIT_PASSWORD_RESET_CONFIRM_MAX', 10),
  });
}

export function criarRateLimitLeituraPublica(): RequestHandler {
  return criarMiddleware({
    windowMs: lerNumeroEnv('RATE_LIMIT_PUBLIC_READ_WINDOW_MS', 60_000),
    max: lerNumeroEnv('RATE_LIMIT_PUBLIC_READ_MAX', 60),
  });
}
