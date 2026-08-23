import { CorsOptions } from 'cors';

export function obterOpcoesCors(): CorsOptions {
  const corsOrigin = process.env.CORS_ORIGIN?.trim();

  if (!corsOrigin || corsOrigin === '*') {
    return {};
  }

  return {
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
  };
}
