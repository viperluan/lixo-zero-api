import { ERRO_EDICAO_NAO_ENCONTRADA } from '@/domain/edicao/erros';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { Usecase } from '../usecase';
import { garantirAnoPosteriorAVigente } from './CriarEdicao';
import { EdicaoSaidaDTO, edicaoParaSaida } from './edicaoSaida';

export type TornarEdicaoVigenteEntradaDTO = {
  id: string;
};

export default class TornarEdicaoVigente
  implements Usecase<TornarEdicaoVigenteEntradaDTO, EdicaoSaidaDTO>
{
  constructor(private readonly edicaoRepository: IEdicaoRepository) {}

  async executar({ id }: TornarEdicaoVigenteEntradaDTO): Promise<EdicaoSaidaDTO> {
    const edicao = await this.edicaoRepository.buscarPorId(id);
    if (!edicao) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    if (edicao.vigente) return edicaoParaSaida(edicao);

    await garantirAnoPosteriorAVigente(this.edicaoRepository, edicao.ano);
    await this.edicaoRepository.tornarVigente(id);

    const atualizada = await this.edicaoRepository.buscarPorId(id);
    if (!atualizada) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    return edicaoParaSaida(atualizada);
  }
}
