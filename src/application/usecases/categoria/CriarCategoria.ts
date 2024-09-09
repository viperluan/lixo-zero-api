import Categoria from '../../../domain/categoria/entity/Categoria';
import ICategoriaRepository from '../../../domain/categoria/repository/ICategoriaRepository';
import { Usecase } from '../usecase';

export type CriarCategoriaEntradaDTO = {
  descricao: string;
};

export type CriarCategoriaSaidaDTO = void;

export default class CriarCategoria
  implements Usecase<CriarCategoriaEntradaDTO, CriarCategoriaSaidaDTO>
{
  constructor(private readonly categoriaRepository: ICategoriaRepository) {}

  public async executar({ descricao }: CriarCategoriaEntradaDTO): Promise<void> {
    const categoriaExiste = await this.categoriaRepository.buscarPorDescricao(descricao);
    if (categoriaExiste) throw new Error('Descrição de categoria já cadastrada.');

    const categoriaNova = Categoria.criarNovaCategoria({ descricao });
    await this.categoriaRepository.salvar(categoriaNova);
  }
}
