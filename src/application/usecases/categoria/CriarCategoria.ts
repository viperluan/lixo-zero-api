import Categoria from '@/domain/categoria/entity/Categoria';
import ICategoriaRepository from '@/domain/categoria/repository/ICategoriaRepository';
import { Usecase } from '../usecase';

export type CriarCategoriaEntradaDTO = {
  descricao: string;
};

export type CriarCategoriaSaidaDTO = {
  id: string;
  descricao: string;
};

export default class CriarCategoria
  implements Usecase<CriarCategoriaEntradaDTO, CriarCategoriaSaidaDTO>
{
  constructor(private readonly categoriaRepository: ICategoriaRepository) {}

  public async executar({ descricao }: CriarCategoriaEntradaDTO): Promise<CriarCategoriaSaidaDTO> {
    const categoriaExiste = await this.categoriaRepository.buscarPorDescricao(descricao);
    if (categoriaExiste) throw new Error('Descrição de categoria já cadastrada.');

    const categoriaNova = Categoria.criarNovaCategoria({ descricao });
    await this.categoriaRepository.salvar(categoriaNova);

    return { id: categoriaNova.id, descricao: categoriaNova.descricao };
  }
}
