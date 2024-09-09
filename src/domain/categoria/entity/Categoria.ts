import { v4 as gerarUuid } from 'uuid';

export type CategoriaProps = {
  id: string;
  descricao: string;
};

export default class Categoria {
  private constructor(private readonly props: CategoriaProps) {}

  public static criarNovaCategoria(descricao: string) {
    return new Categoria({
      id: gerarUuid(),
      descricao,
    });
  }

  public static carregarCategoriaExistente(props: CategoriaProps) {
    return new Categoria(props);
  }
}
