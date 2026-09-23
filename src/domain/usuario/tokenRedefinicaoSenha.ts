import { createHash, randomBytes } from 'crypto';

export type RedefinicaoSenha = {
  id: string;
  id_usuario: string;
  expira_em: Date;
  usado_em: Date | null;
  criado_em: Date;
};

export function gerarTokenRedefinicaoSenha(): string {
  return randomBytes(32).toString('base64url');
}

export function hashTokenRedefinicaoSenha(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
