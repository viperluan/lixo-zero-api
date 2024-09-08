import Cota from '../entity/Cota';

export default interface ICotaRepository {
  buscarPorId(id: string): Promise<Cota | null>;
  buscarPorDescricao(descricao: string): Promise<Cota | null>;
  buscarComPaginacao(pagina: number, limiteCotas: number): Promise<Cota[] | null>;
  buscarQuantidadeCotas(): Promise<number>;
  salvar(usuario: Cota): Promise<void>;
  atualizar(usuario: Cota): Promise<void>;
  deletar(id: string): Promise<void>;
}
