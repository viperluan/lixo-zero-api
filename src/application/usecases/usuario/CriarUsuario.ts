import Usuario from '../../../domain/usuario/entity/Usuario';
import IUsuarioRepository from '../../../domain/usuario/repository/IUsuarioRepository';

export type CriarUsuarioInputDTO = {
  nome: string;
  email: string;
  senha: string;
  cpf_cnpj: string;
};

export default class CriarUsuario {
  constructor(readonly usuarioRepository: IUsuarioRepository) {}

  async executar({ nome, email, senha, cpf_cnpj }: CriarUsuarioInputDTO): Promise<void> {
    const emailExiste = await this.usuarioRepository.buscarPorEmail(email);

    if (emailExiste) throw new Error('Email já cadastrado.');

    const cpfCnpjExiste = await this.usuarioRepository.buscarPorCpfCnpj(cpf_cnpj);

    if (cpfCnpjExiste) throw new Error('CPF/CNPJ já cadastrado.');

    const usuario = Usuario.criarNovoUsuario({ nome, email, senha, cpf_cnpj });

    await this.usuarioRepository.salvar(usuario);
  }
}
