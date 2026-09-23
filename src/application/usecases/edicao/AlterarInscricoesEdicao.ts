import { ERRO_EDICAO_NAO_ENCONTRADA, ERRO_SO_EDICAO_VIGENTE } from '@/domain/edicao/erros';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { Usecase } from '../usecase';
import { EdicaoSaidaDTO, edicaoParaSaida } from './edicaoSaida';

export type AlterarInscricoesEdicaoEntradaDTO = {
  id: string;
  inscricoes_abertas: boolean;
};

export default class AlterarInscricoesEdicao
  implements Usecase<AlterarInscricoesEdicaoEntradaDTO, EdicaoSaidaDTO>
{
  constructor(private readonly edicaoRepository: IEdicaoRepository) {}

  async executar({
    id,
    inscricoes_abertas,
  }: AlterarInscricoesEdicaoEntradaDTO): Promise<EdicaoSaidaDTO> {
    if (typeof inscricoes_abertas !== 'boolean') {
      throw new Error('Informe inscricoes_abertas como verdadeiro ou falso.');
    }

    const edicao = await this.edicaoRepository.buscarPorId(id);
    if (!edicao) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);
    if (!edicao.vigente) throw new Error(ERRO_SO_EDICAO_VIGENTE);

    await this.edicaoRepository.alterarInscricoes(id, inscricoes_abertas);

    const atualizada = await this.edicaoRepository.buscarPorId(id);
    if (!atualizada) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    return edicaoParaSaida(atualizada);
  }
}
