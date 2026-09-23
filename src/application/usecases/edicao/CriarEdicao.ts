import Edicao from '@/domain/edicao/entity/Edicao';
import {
  ERRO_ANO_ANTERIOR,
  ERRO_ANO_JA_CADASTRADO,
  ERRO_REATIVAR_EDICAO_ANTERIOR,
} from '@/domain/edicao/erros';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { anoCivilAtual } from '@/shared/utils/diaCivil';
import { Usecase } from '../usecase';
import { EdicaoSaidaDTO, edicaoParaSaida } from './edicaoSaida';

export type CriarEdicaoEntradaDTO = {
  ano: number;
  data_inicio_cadastro: string;
  data_fim_cadastro: string;
  data_inicio_realizacao: string;
  data_fim_realizacao: string;
  inscricoes_abertas: boolean;
  vigente: boolean;
};

export default class CriarEdicao implements Usecase<CriarEdicaoEntradaDTO, EdicaoSaidaDTO> {
  constructor(private readonly edicaoRepository: IEdicaoRepository) {}

  async executar(entrada: CriarEdicaoEntradaDTO): Promise<EdicaoSaidaDTO> {
    const edicao = Edicao.criarNovaEdicao(entrada);

    if (edicao.ano < anoCivilAtual()) throw new Error(ERRO_ANO_ANTERIOR);

    const anoExiste = await this.edicaoRepository.buscarPorAno(edicao.ano);
    if (anoExiste) throw new Error(ERRO_ANO_JA_CADASTRADO);

    if (edicao.vigente) {
      await garantirAnoPosteriorAVigente(this.edicaoRepository, edicao.ano);
    }

    await this.edicaoRepository.salvar(edicao);

    return edicaoParaSaida(edicao);
  }
}

export async function garantirAnoPosteriorAVigente(
  edicaoRepository: IEdicaoRepository,
  ano: number
): Promise<void> {
  if (ano < anoCivilAtual()) throw new Error(ERRO_REATIVAR_EDICAO_ANTERIOR);

  const vigente = await edicaoRepository.buscarVigente();
  if (vigente && ano <= vigente.ano) throw new Error(ERRO_REATIVAR_EDICAO_ANTERIOR);
}
