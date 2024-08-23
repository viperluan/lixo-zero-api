import IUsuarioRepository from '../../../domain/usuario/repository/IUsuarioRepository';

export type DeletarUsuarioInputDTO = {
  id: string;
};

export default class DeletarUsuario {
  constructor(readonly usuarioRepository: IUsuarioRepository) {}

  async executar({ id }: DeletarUsuarioInputDTO): Promise<void> {
    const idExiste = await this.usuarioRepository.buscarPorId(id);

    if (!idExiste) throw new Error('Usuário não existe.');

    await this.usuarioRepository.deletar(id);
  }
}
