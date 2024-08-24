import Usuario from '../entity/Usuario';

export default interface IUsuarioRepository {
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorCpfCnpj(cpf_cnpj: string): Promise<Usuario | null>;
  buscarComPaginacao(pagina: number, limiteUsuarios: number): Promise<Usuario[] | null>;
  buscarQuantidadeUsuarios(): Promise<number>;
  criar(usuario: Usuario): Promise<void>;
  atualizar(usuario: Usuario): Promise<void>;
  deletar(id: string): Promise<void>;
}
