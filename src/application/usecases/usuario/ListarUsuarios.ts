import Usuario from '../../../domain/usuario/entity/Usuario';
import IUsuarioRepository from '../../../domain/usuario/repository/IUsuarioRepository';
import { Usecase } from '../usecase';

type ListarUsuariosDTO = {
  id: string;
  nome: string;
  tipo: string;
  email: string;
  cpf_cnpj: string;
};

type ObjetoSaidaProps = {
  usuarios: Usuario[] | null;
  totalUsuarios: number;
  paginaAtual: number;
  limiteDeUsuariosPorPagina: number;
};

export type ListarUsuariosEntradaDTO = {
  paginaAtual: number;
  limiteUsuarios: number;
};

export type ListarUsuariosSaidaDTO = {
  usuarios: ListarUsuariosDTO[];
  paginaAtual: number;
  totalDePaginas: number;
};

export default class ListarUsuarios
  implements Usecase<ListarUsuariosEntradaDTO, ListarUsuariosSaidaDTO>
{
  constructor(private readonly usuarioRepository: IUsuarioRepository) {}

  async executar({
    paginaAtual = 1,
    limiteDeUsuariosPorPagina = 10,
  }): Promise<ListarUsuariosSaidaDTO> {
    const usuarios = await this.usuarioRepository.buscarComPaginacao(
      paginaAtual,
      limiteDeUsuariosPorPagina
    );
    const totalUsuarios = await this.usuarioRepository.buscarQuantidadeUsuarios();

    const saida = this.objetoSaida({
      usuarios,
      totalUsuarios,
      paginaAtual,
      limiteDeUsuariosPorPagina,
    });

    return saida;
  }

  private objetoSaida({
    usuarios,
    totalUsuarios,
    paginaAtual,
    limiteDeUsuariosPorPagina,
  }: ObjetoSaidaProps): ListarUsuariosSaidaDTO {
    if (!usuarios) {
      return {
        usuarios: [],
        paginaAtual: 1,
        totalDePaginas: 1,
      } as ListarUsuariosSaidaDTO;
    }

    const usuariosSaidaDto: ListarUsuariosDTO[] = usuarios.map(
      ({ id, nome, tipo, email, cpf_cnpj }) => ({
        id,
        nome,
        tipo,
        email,
        cpf_cnpj,
      })
    );

    const saida: ListarUsuariosSaidaDTO = {
      usuarios: usuariosSaidaDto,
      paginaAtual,
      totalDePaginas: Math.ceil(totalUsuarios / limiteDeUsuariosPorPagina),
    };

    return saida;
  }
}
