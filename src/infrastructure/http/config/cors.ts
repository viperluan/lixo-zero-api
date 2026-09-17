import { CorsOptions } from 'cors';

const CABECALHOS_EXPOSTOS = ['X-Session-Expired'];

export function obterOpcoesCors(): CorsOptions {
  const corsOrigin = process.env.CORS_ORIGIN?.trim();

  if (!corsOrigin || corsOrigin === '*') {
    return { exposedHeaders: CABECALHOS_EXPOSTOS };
  }

  return {
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    exposedHeaders: CABECALHOS_EXPOSTOS,
  };
}
