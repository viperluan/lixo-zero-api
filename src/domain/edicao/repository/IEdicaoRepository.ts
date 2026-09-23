import Edicao from '../entity/Edicao';

export type ProrrogacaoEdicaoRegistro = {
  id: string;
  data_fim_cadastro_anterior: Date;
  data_fim_cadastro_nova: Date;
  prorrogada_em: Date;
  id_usuario: string;
  nome_usuario: string;
};

export type AtualizarDatasEdicao = {
  data_inicio_cadastro: Date;
  data_fim_cadastro: Date;
  data_inicio_realizacao: Date;
  data_fim_realizacao: Date;
};

export default interface IEdicaoRepository {
  buscarPorId(id: string): Promise<Edicao | null>;
  buscarPorAno(ano: number): Promise<Edicao | null>;
  buscarVigente(): Promise<Edicao | null>;
  listar(): Promise<Edicao[]>;
  listarProrrogacoes(idEdicao: string): Promise<ProrrogacaoEdicaoRegistro[]>;
  salvar(edicao: Edicao): Promise<void>;
  prorrogar(idEdicao: string, dataFimCadastro: Date, idUsuario: string): Promise<void>;
  alterarInscricoes(idEdicao: string, inscricoesAbertas: boolean): Promise<void>;
  tornarVigente(idEdicao: string): Promise<void>;
  atualizarDatas(idEdicao: string, datas: AtualizarDatasEdicao): Promise<void>;
  contarAcoesForaDaRealizacao(idEdicao: string, inicio: string, fim: string): Promise<number>;
}
