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
  senha_alterada_em: Date | null;
};

export default class Usuario {
  private constructor(private readonly props: UsuarioProps) {}

  private static criptografarSenha(senhaLimpa: string): string {
    return bcrypt.hashSync(senhaLimpa, 10);
  }

  public static criarNovoUsuario(
    novoUsuario: Omit<UsuarioProps, 'id' | 'status' | 'tipo' | 'senha_alterada_em'>
  ): Usuario {
    const senhaCriptografada = this.criptografarSenha(novoUsuario.senha);

    return new Usuario({
      id: gerarUuid(),
      ...novoUsuario,
      senha: senhaCriptografada,
      status: true,
      tipo: '1',
      senha_alterada_em: null,
    });
  }

  public static redefinirSenha(usuario: Usuario, senhaLimpa: string): Usuario {
    return new Usuario({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      senha: this.criptografarSenha(senhaLimpa),
      cpf_cnpj: usuario.cpf_cnpj,
      status: usuario.status,
      tipo: usuario.tipo,
      senha_alterada_em: new Date(),
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

  public get senha_alterada_em() {
    return this.props.senha_alterada_em;
  }
}
