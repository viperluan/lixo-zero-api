import { ERRO_EDICAO_NAO_ENCONTRADA, ERRO_EDICAO_VINCULADA_A_ACOES } from '@/domain/edicao/erros';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { Usecase } from '../usecase';

export type DeletarEdicaoEntradaDTO = {
  id: string;
};

export type DeletarEdicaoSaidaDTO = void;

export default class DeletarEdicao
  implements Usecase<DeletarEdicaoEntradaDTO, DeletarEdicaoSaidaDTO>
{
  constructor(private readonly edicaoRepository: IEdicaoRepository) {}

  async executar({ id }: DeletarEdicaoEntradaDTO): Promise<void> {
    const edicao = await this.edicaoRepository.buscarPorId(id);
    if (!edicao) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    const quantidadeAcoes = await this.edicaoRepository.contarAcoes(id);
    if (quantidadeAcoes > 0) throw new Error(ERRO_EDICAO_VINCULADA_A_ACOES);

    await this.edicaoRepository.deletar(id);
  }
}
