import Usuario from '../../domain/entities/Usuario';
import IUsuarioRepository from '../../domain/repositories/IUsuarioRepository';

export type CriarUsuarioDTO = {
  nome: string;
  email: string;
  senha: string;
  cpf_cnpj: string;
};

export default class CriarUsuario {
  constructor(readonly usuarioRepository: IUsuarioRepository) {}

  async executar(usuarioDto: CriarUsuarioDTO): Promise<void> {
    const emailExiste = await this.usuarioRepository.buscarPorEmail(usuarioDto.email);

    if (emailExiste) throw new Error('Email já cadastrado.');

    const cpfCnpjExiste = await this.usuarioRepository.buscarPorCpfCnpj(usuarioDto.cpf_cnpj);

    if (cpfCnpjExiste) throw new Error('CPF/CNPJ já cadastrado.');

    const usuario = Usuario.criarNovoUsuario(usuarioDto);

    await this.usuarioRepository.salvar(usuario);
  }
}
