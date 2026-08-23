import IUsuarioRepository from '../../../domain/usuario/repository/IUsuarioRepository';
import { Usecase } from '../usecase';

export const ERRO_USUARIO_NAO_EXISTE = 'Usuário não existe.';
export const ERRO_USUARIO_VINCULADO_A_ACOES =
  'Não é possível excluir um usuário vinculado a ações.';

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
    if (!idExiste) throw new Error(ERRO_USUARIO_NAO_EXISTE);

    const possuiAcaoVinculada = await this.usuarioRepository.possuiAcaoVinculada(id);
    if (possuiAcaoVinculada) throw new Error(ERRO_USUARIO_VINCULADO_A_ACOES);

    await this.usuarioRepository.deletar(id);
  }
}
