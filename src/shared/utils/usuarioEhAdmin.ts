import { TokenDecodificado } from '../../application/usecases/usuario/VerificarTokenUsuario';

export function usuarioEhAdmin(usuario?: TokenDecodificado): boolean {
  return usuario?.tipo === '0';
}
