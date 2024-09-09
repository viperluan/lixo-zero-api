import Categoria from '../entity/Categoria';

export default interface ICategoriaRepository {
  buscarPorId(id: string): Promise<Categoria | null>;
  buscarPorDescricao(descricao: string): Promise<Categoria | null>;
  buscarComPaginacao(
    paginaAtual: number,
    limiteDeCategoriasPorPagina: number
  ): Promise<Categoria[] | null>;
  buscarQuantidadeCategorias(): Promise<number>;
  salvar(categoria: Categoria): Promise<void>;
  atualizar(categoria: Categoria): Promise<void>;
  deletar(id: string): Promise<void>;
}
