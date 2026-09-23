import { ERRO_EDICAO_VIGENTE_AUSENTE } from '@/domain/edicao/erros';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { Usecase } from '../usecase';
import { EdicaoSaidaDTO, edicaoParaSaida } from './edicaoSaida';

export type ObterEdicaoVigenteEntradaDTO = Record<string, never>;

export default class ObterEdicaoVigente
  implements Usecase<ObterEdicaoVigenteEntradaDTO, EdicaoSaidaDTO>
{
  constructor(private readonly edicaoRepository: IEdicaoRepository) {}

  async executar(): Promise<EdicaoSaidaDTO> {
    const edicao = await this.edicaoRepository.buscarVigente();
    if (!edicao) throw new Error(ERRO_EDICAO_VIGENTE_AUSENTE);

    return edicaoParaSaida(edicao);
  }
}
