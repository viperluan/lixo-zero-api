import Cota from '../../../domain/cota/entity/Cota';
import ICotaRepository from '../../../domain/cota/repository/ICotaRepository';
import { Usecase } from '../usecase';

type ListarCotasDTO = {
  id: string;
  descricao: string;
};

export type ListarCotasEntradaDTO = {
  paginaAtual: number;
  limiteDeCotasPorPagina: number;
};

export type ListarCotasSaidaDTO = {
  cotas: ListarCotasDTO[];
  totalDePaginas: number;
};

type ObjetoSaidaProps = {
  cotas: Cota[] | null;
  totalCotas: number;
  limiteDeCotasPorPagina: number;
};

export default class ListarCotas implements Usecase<ListarCotasEntradaDTO, ListarCotasSaidaDTO> {
  constructor(private readonly cotaRepository: ICotaRepository) {}

  public async executar({
    paginaAtual,
    limiteDeCotasPorPagina,
  }: ListarCotasEntradaDTO): Promise<ListarCotasSaidaDTO> {
    const cotas = await this.cotaRepository.buscarComPaginacao(paginaAtual, limiteDeCotasPorPagina);
    const totalCotas = await this.cotaRepository.buscarQuantidadeCotas();

    return this.objetoDeSaida({ cotas, totalCotas, limiteDeCotasPorPagina });
  }

  private objetoDeSaida({ cotas, totalCotas, limiteDeCotasPorPagina }: ObjetoSaidaProps) {
    if (!cotas) {
      return {
        cotas: [],
        totalDePaginas: 1,
      } as ListarCotasSaidaDTO;
    }

    const cotasSaidaDto: ListarCotasDTO[] = cotas.map(({ id, descricao }) => {
      return {
        id,
        descricao,
      };
    });

    const saida: ListarCotasSaidaDTO = {
      cotas: cotasSaidaDto,
      totalDePaginas: Math.ceil(totalCotas / limiteDeCotasPorPagina),
    };

    return saida;
  }
}
