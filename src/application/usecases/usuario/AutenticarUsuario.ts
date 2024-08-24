import Usuario from '../../../domain/usuario/entity/Usuario';
import IUsuarioRepository from '../../../domain/usuario/repository/IUsuarioRepository';
import { Usecase } from '../usecase';

export type AutenticarUsuarioEntradaDTO = {
  email: string;
  senha: string;
};

export type AutenticarUsuarioSaidaDTO = {
  id: string;
  nome: string;
  tipo: string;
  email: string;
};

export default class AutenticarUsuario
  implements Usecase<AutenticarUsuarioEntradaDTO, AutenticarUsuarioSaidaDTO>
{
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async executar({
    email,
    senha,
  }: AutenticarUsuarioEntradaDTO): Promise<AutenticarUsuarioSaidaDTO> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) throw new Error('Email ou senha incorretos');

    const senhasSaoIguais = Usuario.compararSenha(senha, usuario.senha);
    if (!senhasSaoIguais) throw new Error('Email ou senha incorretos');

    return this.objetoSaida(usuario);
  }

  private objetoSaida({ id, nome, email, tipo }: Usuario): AutenticarUsuarioSaidaDTO {
    const output: AutenticarUsuarioSaidaDTO = {
      id,
      nome,
      email,
      tipo,
    };

    return output;
  }
}
