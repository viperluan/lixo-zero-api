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
  tipo: number;
  email: string;
};

export default class AutenticarUsuario
  implements Usecase<AutenticarUsuarioEntradaDTO, AutenticarUsuarioSaidaDTO>
{
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async executar({
    email,
    senha,
  }: AutenticarUsuarioEntradaDTO): Promise<AutenticarUsuarioSaidaDTO> {
    const emailExiste = await this.usuarioRepository.buscarPorEmail(email);

    if (!emailExiste) throw new Error('Email ou senha incorretos');

    const senhasSaoIguais = Usuario.compararSenha(senha, emailExiste.senha);

    if (!senhasSaoIguais) throw new Error('Email ou senha incorretos');

    return {
      id: emailExiste.id,
      nome: emailExiste.nome,
      email: emailExiste.email,
      tipo: emailExiste.tipo,
    };
  }
}
