import Acao from '../entity/Acao';
import { FiltrosListarComPaginacaoType } from '@/application/repositories/AcaoPrismaRepository';

export default interface IAcaoRepository {
  buscarPorId(id: string): Promise<Acao | null>;
  buscarPorTituloNaEdicao(titulo: string, idEdicao: string): Promise<Acao | null>;
  buscarQuantidadeDeAcoes(): Promise<number>;
  contarComFiltros(filtros: FiltrosListarComPaginacaoType): Promise<number>;
  listarComPaginacao(
    filtros: FiltrosListarComPaginacaoType,
    pagina: number,
    limiteAcoes: number
  ): Promise<Acao[] | null>;
  listarPorData(
    intervalo: { inicio: Date; fim: Date },
    situacao?: string,
    idEdicao?: string
  ): Promise<Acao[] | null>;
  listarPorIntervaloData(
    dataInicial: Date,
    dataFinal: Date,
    situacao?: string,
    idEdicao?: string
  ): Promise<Acao[] | null>;
  salvar(acao: Acao): Promise<void>;
  atualizar(id: string, campos: unknown): Promise<Acao>;
  deletar(id: string): Promise<void>;
}
