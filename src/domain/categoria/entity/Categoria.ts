import { v4 as gerarUuid } from 'uuid';

export type CategoriaProps = {
  id: string;
  descricao: string;
};

type OmitirDadosNovaCategoriaProps = 'id';

type NovaCategoriaProps = Omit<CategoriaProps, OmitirDadosNovaCategoriaProps>;

export default class Categoria {
  private constructor(private readonly props: CategoriaProps) {}

  public static criarNovaCategoria(categoria: NovaCategoriaProps) {
    this.validacao(categoria);

    return new Categoria({
      id: gerarUuid(),
      descricao: categoria.descricao,
    });
  }

  public static carregarCategoriaExistente(props: CategoriaProps) {
    return new Categoria(props);
  }

  private static validacao({ descricao }: NovaCategoriaProps) {
    this.validarDescricao(descricao);
  }

  private static validarDescricao(descricao: string) {
    if (!descricao) throw new Error('A categoria deve possuir uma descrição');

    if (descricao.length > 100) {
      throw new Error('A descrição não pode conter mais de 100 caracteres.');
    }
  }

  public get id(): string {
    return this.props.id;
  }

  public get descricao(): string {
    return this.props.descricao;
  }
}
