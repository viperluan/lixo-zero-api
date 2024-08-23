import Usuario from '../../domain/entities/Usuario';
import IUsuarioRepository from '../../domain/repositories/IUsuarioRepository';

export type AutenticarUsuarioOutputDTO = {
  id: string;
  nome: string;
  tipo: number;
  email: string;
};

export default class AutenticarUsuario {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async executar(email: string, senha: string): Promise<AutenticarUsuarioOutputDTO> {
    const emailExiste = await this.usuarioRepository.buscarPorEmail(email);

    if (!emailExiste) throw new Error('Email ou senha incorretos');

    const senhasSaoIguais = Usuario.compararSenha(senha, emailExiste.senha);

    if (!senhasSaoIguais) throw new Error('Email ou senha incorretos');

    const outputDto: AutenticarUsuarioOutputDTO = {
      id: emailExiste.id,
      nome: emailExiste.nome,
      email: emailExiste.email,
      tipo: emailExiste.tipo,
    };

    return outputDto;
  }
}
