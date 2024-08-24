import { v4 as gerarUuid } from 'uuid';

import { PatrocinadorSituacao } from '../enum/PatrocinadorSituacao';

export type PatrocinadorProps = {
  id: string;
  nome: string;
  celular: string;
  descricao: string;
  id_cota: string;
  data_cadastro: Date;
  data_atualizacao: Date;
  situacao: number;
  id_usuario_alteracao: string | null;
  id_usuario_patrocinio: string;
};

export default class Patrocinador {
  private constructor(readonly props: PatrocinadorProps) {}

  public static criarNovoPatrocinador(
    novoPatrocinador: Pick<
      PatrocinadorProps,
      'nome' | 'celular' | 'descricao' | 'id_cota' | 'id_usuario_patrocinio'
    >
  ) {
    return new Patrocinador({
      id: gerarUuid(),
      ...novoPatrocinador,
      data_cadastro: new Date(),
      data_atualizacao: new Date(),
      id_usuario_alteracao: null,
      situacao: PatrocinadorSituacao.Pendente,
    });
  }

  public static carregarPatrocinadorExistente(props: PatrocinadorProps) {
    return new Patrocinador(props);
  }
}
