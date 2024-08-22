import { v4 as gerarUuid } from 'uuid';

export type AcaoProps = {
  id: string;
  celular: string;
  nome_organizador: string;
  link_organizador: string;
  titulo_acao: string;
  descricao_acao: string;
  forma_realizacao_acao: string;
  local_acao: string;
  numero_organizadores_acao: number;
  receber_informacao_patrocinio: boolean;
  situacao_acao: number;
  data_acao: Date;
  data_cadastro: Date;
  data_atualizacao: Date;
  id_categoria: string;
  id_usuario_reponsavel: string;
  id_usuario_alteracao: string | null;
};

export default class Acao {
  private constructor(readonly props: AcaoProps) {}

  public static criarNovaAcao(novaAcao: Omit<AcaoProps, 'id' | 'id_usuario_alteracao'>) {
    return new Acao({
      ...novaAcao,
      id: gerarUuid(),
      id_usuario_alteracao: null,
    });
  }

  public static carregarAcaoExistente(props: AcaoProps) {
    return new Acao(props);
  }
}
