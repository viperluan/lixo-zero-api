import IUsuarioRepository from '../../../domain/usuario/repository/IUsuarioRepository';
import { Usecase } from '../usecase';

export type DeletarUsuarioEntradaDTO = {
  id: string;
};

export type DeletarUsuarioSaidaDTO = void;

export default class DeletarUsuario
  implements Usecase<DeletarUsuarioEntradaDTO, DeletarUsuarioSaidaDTO>
{
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async executar({ id }: DeletarUsuarioEntradaDTO): Promise<void> {
    const idExiste = await this.usuarioRepository.buscarPorId(id);
    if (!idExiste) throw new Error('Usuário não existe.');

    await this.usuarioRepository.deletar(id);
  }
}
