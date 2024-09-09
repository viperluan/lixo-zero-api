import Patrocinador from '../entity/Patrocinador';

export default interface IPatrocinadorRepository {
  buscarPorId(id: string): Promise<Patrocinador | null>;
  buscarPorNome(nome: string): Promise<Patrocinador | null>;
  buscarComPaginacao(pagina: number, limiteCotas: number): Promise<Patrocinador[] | null>;
  buscarQuantidadePatrocinadores(): Promise<number>;
  salvar(usuario: Patrocinador): Promise<void>;
  atualizar(usuario: Patrocinador): Promise<void>;
  deletar(id: string): Promise<void>;
}
