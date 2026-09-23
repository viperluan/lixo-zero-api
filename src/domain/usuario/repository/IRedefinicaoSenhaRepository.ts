import { RedefinicaoSenha } from '../tokenRedefinicaoSenha';

export default interface IRedefinicaoSenhaRepository {
  buscarPorTokenHash(tokenHash: string): Promise<RedefinicaoSenha | null>;
  buscarMaisRecentePorUsuario(idUsuario: string): Promise<RedefinicaoSenha | null>;
  substituirToken(idUsuario: string, tokenHash: string, expiraEm: Date): Promise<void>;
  consumir(id: string, idUsuario: string, senha: string, senha_alterada_em: Date): Promise<boolean>;
}
