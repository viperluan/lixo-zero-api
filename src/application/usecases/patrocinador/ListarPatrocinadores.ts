import Patrocinador, {
  PatrocinadorRelacaoCota,
  PatrocinadorRelacaoUsuarioPatrocinio,
} from '../../../domain/patrocinador/entity/Patrocinador';
import IPatrocinadorRepository from '../../../domain/patrocinador/repository/IPatrocinadorRepository';
import { Usecase } from '../usecase';

type ListarPatrocinadoresDTO = {
  nome: string;
  celular: string;
  descricao: string;
  situacao: string;
  data_cadastro: Date;
  cota?: PatrocinadorRelacaoCota;
  usuario_patrocinio?: PatrocinadorRelacaoUsuarioPatrocinio;
};

type ObjetoSaidaProps = {
  patrocinadores: Patrocinador[] | null;
  totalPatrocinadores: number;
  limiteDePatrocinadoresPorPagina: number;
};

export type ListarPatrocinadoresEntradaDTO = {
  paginaAtual: number;
  limiteDePatrocinadoresPorPagina: number;
};

export type ListarPatrocinadoresSaidaDTO = {
  patrocinadores: ListarPatrocinadoresDTO[];
  totalDePaginas: number;
};

export default class ListarPatrocinadores
  implements Usecase<ListarPatrocinadoresEntradaDTO, ListarPatrocinadoresSaidaDTO>
{
  constructor(private readonly patrocinadorRepository: IPatrocinadorRepository) {}

  async executar({
    paginaAtual = 1,
    limiteDePatrocinadoresPorPagina = 10,
  }): Promise<ListarPatrocinadoresSaidaDTO> {
    const patrocinadores = await this.patrocinadorRepository.buscarComPaginacao(
      paginaAtual,
      limiteDePatrocinadoresPorPagina
    );

    const totalPatrocinadores = await this.patrocinadorRepository.buscarQuantidadePatrocinadores();

    return this.objetoSaida({
      patrocinadores,
      totalPatrocinadores,
      limiteDePatrocinadoresPorPagina,
    });
  }

  private objetoSaida({
    patrocinadores,
    totalPatrocinadores,
    limiteDePatrocinadoresPorPagina,
  }: ObjetoSaidaProps): ListarPatrocinadoresSaidaDTO {
    if (!patrocinadores) {
      return {
        patrocinadores: [],
        totalDePaginas: 1,
      } as ListarPatrocinadoresSaidaDTO;
    }

    const patrocinadoresSaidaDto: ListarPatrocinadoresDTO[] = patrocinadores.map(
      ({ nome, celular, descricao, situacao, data_cadastro, cota, usuario_patrocinio }) => ({
        nome,
        celular,
        descricao,
        situacao,
        data_cadastro,
        cota,
        usuario_patrocinio,
      })
    );

    const saida: ListarPatrocinadoresSaidaDTO = {
      patrocinadores: patrocinadoresSaidaDto,
      totalDePaginas: Math.ceil(totalPatrocinadores / limiteDePatrocinadoresPorPagina),
    };

    return saida;
  }
}
