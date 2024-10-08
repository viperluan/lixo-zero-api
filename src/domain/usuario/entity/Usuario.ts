import { v4 as gerarUuid } from 'uuid';
import bcrypt from 'bcrypt';

export type UsuarioProps = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  cpf_cnpj: string;
  status: boolean;
  tipo: string;
};

export default class Usuario {
  private constructor(private readonly props: UsuarioProps) {}

  private static criptografarSenha(senhaLimpa: string): string {
    return bcrypt.hashSync(senhaLimpa, 10);
  }

  public static criarNovoUsuario(
    novoUsuario: Omit<UsuarioProps, 'id' | 'status' | 'tipo'>
  ): Usuario {
    const senhaCriptografada = this.criptografarSenha(novoUsuario.senha);

    return new Usuario({
      id: gerarUuid(),
      ...novoUsuario,
      senha: senhaCriptografada,
      status: true,
      tipo: '1',
    });
  }

  public static carregarUsuarioExistente(props: UsuarioProps): Usuario {
    return new Usuario(props);
  }

  public static compararSenha(senhaLimpa: string, senhaCriptografada: string): boolean {
    return bcrypt.compareSync(senhaLimpa, senhaCriptografada);
  }

  public get id() {
    return this.props.id;
  }

  public get nome() {
    return this.props.nome;
  }

  public get email() {
    return this.props.email;
  }

  public get senha() {
    return this.props.senha;
  }

  public get cpf_cnpj() {
    return this.props.cpf_cnpj;
  }

  public get status() {
    return this.props.status;
  }

  public get tipo() {
    return this.props.tipo;
  }
}
