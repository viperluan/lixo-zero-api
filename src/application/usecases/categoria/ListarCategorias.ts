import Categoria from '../../../domain/categoria/entity/Categoria';
import ICategoriaRepository from '../../../domain/categoria/repository/ICategoriaRepository';
import { Usecase } from '../usecase';

type ListarCategoriasDTO = {
  descricao: string;
};

type ObjetoSaidaProps = {
  categorias: Categoria[] | null;
  totalDeCategorias: number;
  limiteDeCategoriasPorPagina: number;
};

export type ListarCategoriasEntradaDTO = {
  paginaAtual: number;
  limiteDeCategoriasPorPagina: number;
};

export type ListarCategoriasSaidaDTO = {
  categorias: ListarCategoriasDTO[];
  totalDePaginas: number;
};

export default class ListarCategorias
  implements Usecase<ListarCategoriasEntradaDTO, ListarCategoriasSaidaDTO>
{
  constructor(private readonly categoriaRepository: ICategoriaRepository) {}

  async executar({
    paginaAtual = 1,
    limiteDeCategoriasPorPagina = 10,
  }): Promise<ListarCategoriasSaidaDTO> {
    const categorias = await this.categoriaRepository.buscarComPaginacao(
      paginaAtual,
      limiteDeCategoriasPorPagina
    );

    const totalDeCategorias = await this.categoriaRepository.buscarQuantidadeCategorias();

    return this.objetoSaida({
      categorias,
      totalDeCategorias,
      limiteDeCategoriasPorPagina,
    });
  }

  private objetoSaida({
    categorias,
    totalDeCategorias,
    limiteDeCategoriasPorPagina,
  }: ObjetoSaidaProps): ListarCategoriasSaidaDTO {
    if (!categorias) {
      return {
        categorias: [],
        totalDePaginas: 1,
      } as ListarCategoriasSaidaDTO;
    }

    const categoriasSaidaDto: ListarCategoriasDTO[] = categorias.map(({ descricao }) => ({
      descricao,
    }));

    const saida: ListarCategoriasSaidaDTO = {
      categorias: categoriasSaidaDto,
      totalDePaginas: Math.ceil(totalDeCategorias / limiteDeCategoriasPorPagina),
    };

    return saida;
  }
}
