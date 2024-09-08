import { v4 as gerarUuid } from 'uuid';

export type CotaProps = {
  id: string;
  descricao: string;
};

type OmitirDadosNovaCotaProps = 'id';

type NovaCotaProps = Omit<CotaProps, OmitirDadosNovaCotaProps>;

export default class Cota {
  private constructor(readonly props: CotaProps) {}

  public static criarNovaCota(cota: NovaCotaProps) {
    this.validacao(cota);

    return new Cota({
      id: gerarUuid(),
      descricao: cota.descricao,
    });
  }

  public static carregarCotaExistente(props: CotaProps) {
    return new Cota(props);
  }

  private static validacao({ descricao }: NovaCotaProps) {
    this.validarDescricao(descricao);
  }

  private static validarDescricao(descricao: string) {
    if (!descricao) throw new Error('A cota deve possuir uma descrição');

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
