import Edicao from '@/domain/edicao/entity/Edicao';
import {
  ERRO_ATUALIZACAO_SEM_DATA,
  ERRO_EDICAO_NAO_ENCONTRADA,
  ERRO_FIM_CADASTRO_SO_PRORROGACAO,
  ERRO_REALIZACAO_NAO_COBRE,
  ERRO_SO_EDICAO_VIGENTE,
} from '@/domain/edicao/erros';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { diaCivilDeColunaDate } from '@/shared/utils/diaCivil';
import { Usecase } from '../usecase';
import { EdicaoSaidaDTO, edicaoParaSaida } from './edicaoSaida';

export type AtualizarEdicaoEntradaDTO = {
  id: string;
  data_inicio_cadastro?: string;
  data_fim_cadastro?: string;
  data_inicio_realizacao?: string;
  data_fim_realizacao?: string;
};

export default class AtualizarEdicao implements Usecase<AtualizarEdicaoEntradaDTO, EdicaoSaidaDTO> {
  constructor(private readonly edicaoRepository: IEdicaoRepository) {}

  async executar(entrada: AtualizarEdicaoEntradaDTO): Promise<EdicaoSaidaDTO> {
    const informouData =
      entrada.data_inicio_cadastro !== undefined ||
      entrada.data_fim_cadastro !== undefined ||
      entrada.data_inicio_realizacao !== undefined ||
      entrada.data_fim_realizacao !== undefined;

    if (!informouData) throw new Error(ERRO_ATUALIZACAO_SEM_DATA);

    const edicao = await this.edicaoRepository.buscarPorId(entrada.id);
    if (!edicao) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);
    if (!edicao.vigente) throw new Error(ERRO_SO_EDICAO_VIGENTE);

    if (entrada.data_fim_cadastro !== undefined) {
      const quantidadeAcoes = await this.edicaoRepository.contarAcoes(edicao.id);
      if (quantidadeAcoes > 0) throw new Error(ERRO_FIM_CADASTRO_SO_PRORROGACAO);
    }

    const datas = Edicao.montarIntervalos(
      {
        data_inicio_cadastro:
          entrada.data_inicio_cadastro ?? diaCivilDeColunaDate(edicao.data_inicio_cadastro),
        data_fim_cadastro:
          entrada.data_fim_cadastro ?? diaCivilDeColunaDate(edicao.data_fim_cadastro),
        data_inicio_realizacao:
          entrada.data_inicio_realizacao ?? diaCivilDeColunaDate(edicao.data_inicio_realizacao),
        data_fim_realizacao:
          entrada.data_fim_realizacao ?? diaCivilDeColunaDate(edicao.data_fim_realizacao),
      },
      edicao.ano
    );

    const fora = await this.edicaoRepository.contarAcoesForaDaRealizacao(
      edicao.id,
      diaCivilDeColunaDate(datas.data_inicio_realizacao),
      diaCivilDeColunaDate(datas.data_fim_realizacao)
    );
    if (fora > 0) throw new Error(ERRO_REALIZACAO_NAO_COBRE);

    await this.edicaoRepository.atualizarDatas(edicao.id, datas);

    const atualizada = await this.edicaoRepository.buscarPorId(edicao.id);
    if (!atualizada) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    return edicaoParaSaida(atualizada);
  }
}
