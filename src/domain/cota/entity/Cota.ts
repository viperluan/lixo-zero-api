import { v4 as gerarUuid } from 'uuid';

export type CotaProps = {
  id: string;
  descricao: string;
};

export default class Cota {
  private constructor(readonly props: CotaProps) {}

  public static criarNovaCota(descricao: string) {
    return new Cota({
      id: gerarUuid(),
      descricao,
    });
  }

  public static carregarCotaExistente(props: CotaProps) {
    return new Cota(props);
  }
}
