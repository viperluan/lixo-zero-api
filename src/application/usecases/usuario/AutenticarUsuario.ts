import Usuario from '../../../domain/usuario/entity/Usuario';
import IUsuarioRepository from '../../../domain/usuario/repository/IUsuarioRepository';
import { Usecase } from '../usecase';
import GerarTokenUsuario from './GerarTokenUsuario';

export type AutenticarUsuarioEntradaDTO = {
  email: string;
  senha: string;
};

export type AutenticarUsuarioSaidaDTO = {
  token: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    tipo: string;
  };
};

export default class AutenticarUsuario
  implements Usecase<AutenticarUsuarioEntradaDTO, AutenticarUsuarioSaidaDTO>
{
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly gerarTokenUsuario: GerarTokenUsuario
  ) {}

  async executar({
    email,
    senha,
  }: AutenticarUsuarioEntradaDTO): Promise<AutenticarUsuarioSaidaDTO> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) throw new Error('Email ou senha incorretos');

    const senhasSaoIguais = Usuario.compararSenha(senha, usuario.senha);
    if (!senhasSaoIguais) throw new Error('Email ou senha incorretos');

    return await this.objetoSaida(usuario);
  }

  private async objetoSaida({
    id,
    nome,
    email,
    tipo,
  }: Usuario): Promise<AutenticarUsuarioSaidaDTO> {
    const { token } = await this.gerarTokenUsuario.executar({
      id,
      email,
      nome,
      tipo,
    });

    const saida: AutenticarUsuarioSaidaDTO = {
      token,
      usuario: {
        id,
        email,
        nome,
        tipo,
      },
    };

    return saida;
  }
}
