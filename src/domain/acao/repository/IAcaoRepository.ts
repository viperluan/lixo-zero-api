import Acao from '../entity/Acao';

export type FiltrosListarComPaginacaoType = {
  id_categoria?: string;
  id_usuario?: string;
  id_usuario_responsavel?: string;
  data_acao?: string;
  search?: string;
  situacao?: string;
  forma_realizacao_acao?: string;
};

export default interface IAcaoRepository {
  buscarPorId(id: string): Promise<Acao | null>;
  buscarPorTitulo(titulo: string): Promise<Acao | null>;
  buscarQuantidadeDeAcoes(): Promise<number>;
  listarComPaginacao(
    filtros: FiltrosListarComPaginacaoType,
    pagina: number,
    limiteAcoes: number
  ): Promise<Acao[] | null>;
  listarPorData(data: Date): Promise<Acao[] | null>;
  listarPorIntervaloData(dataInicial: Date, dataFinal: Date): Promise<Acao[] | null>;
  salvar(acao: Acao): Promise<void>;
  atualizar(acao: Acao): Promise<void>;
  deletar(id: string): Promise<void>;
}
