import { UsuarioAutenticado } from '../types/UsuarioAutenticado';

export function usuarioEhAdmin(usuario?: UsuarioAutenticado): boolean {
  return usuario?.tipo === '0';
}
