import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { Usecase } from '../usecase';
import { EdicaoSaidaDTO, edicaoParaSaida } from './edicaoSaida';

export type ListarEdicoesEntradaDTO = Record<string, never>;

export type ListarEdicoesSaidaDTO = {
  editions: EdicaoSaidaDTO[];
};

export default class ListarEdicoes
  implements Usecase<ListarEdicoesEntradaDTO, ListarEdicoesSaidaDTO>
{
  constructor(private readonly edicaoRepository: IEdicaoRepository) {}

  async executar(): Promise<ListarEdicoesSaidaDTO> {
    const edicoes = await this.edicaoRepository.listar();

    return { editions: edicoes.map((edicao) => edicaoParaSaida(edicao)) };
  }
}
