import { v4 as gerarUuid } from 'uuid';

export type UsuarioProps = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  cpf_cnpj: string;
  status: boolean;
  tipo: number;
};

export default class Usuario {
  private constructor(readonly props: UsuarioProps) {}

  public static criarNovoUsuario(novoUsuario: Omit<UsuarioProps, 'id' | 'status' | 'tipo'>) {
    return new Usuario({
      id: gerarUuid(),
      ...novoUsuario,
      status: true,
      tipo: 0,
    });
  }

  public static carregarUsuarioExistente(props: UsuarioProps) {
    return new Usuario(props);
  }
}
