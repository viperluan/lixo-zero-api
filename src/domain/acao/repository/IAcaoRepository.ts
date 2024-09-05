import Acao from '../entity/Acao';

export default interface IAcaoRepository {
  buscarPorId(id: string): Promise<Acao | null>;
  buscarPorTitulo(titulo: string): Promise<Acao | null>;
  buscarQuantidadeDeAcoes(): Promise<number>;
  listarComPaginacao(filtros: unknown, pagina: number, limiteAcoes: number): Promise<Acao[] | null>;
  listarPorData(data: Date): Promise<Acao[] | null>;
  listarPorIntervaloData(dataInicial: Date, dataFinal: Date): Promise<Acao[] | null>;
  salvar(acao: Acao): Promise<void>;
  atualizar(id: string, campos: unknown): Promise<Acao>;
  deletar(id: string): Promise<void>;
}
