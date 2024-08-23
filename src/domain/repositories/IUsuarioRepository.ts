import Usuario from '../entities/Usuario';

export default interface IUsuarioRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorCpfCnpj(cpf_cnpj: string): Promise<Usuario | null>;
  salvar(usuario: Usuario): Promise<void>;
  atualizar(usuario: Usuario): Promise<void>;
  deletar(id: string): Promise<void>;
}
