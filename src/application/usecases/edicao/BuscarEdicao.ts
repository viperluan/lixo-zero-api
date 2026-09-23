import { ERRO_EDICAO_NAO_ENCONTRADA } from '@/domain/edicao/erros';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { diaCivilDeColunaDate } from '@/shared/utils/diaCivil';
import { Usecase } from '../usecase';
import { EdicaoSaidaDTO, edicaoParaSaida } from './edicaoSaida';

export type BuscarEdicaoEntradaDTO = {
  id: string;
};

export type ProrrogacaoSaidaDTO = {
  id: string;
  data_fim_cadastro_anterior: string;
  data_fim_cadastro_nova: string;
  prorrogada_em: Date;
  id_usuario: string;
  nome_usuario: string;
};

export type BuscarEdicaoSaidaDTO = EdicaoSaidaDTO & {
  prorrogacoes: ProrrogacaoSaidaDTO[];
};

export default class BuscarEdicao implements Usecase<BuscarEdicaoEntradaDTO, BuscarEdicaoSaidaDTO> {
  constructor(private readonly edicaoRepository: IEdicaoRepository) {}

  async executar({ id }: BuscarEdicaoEntradaDTO): Promise<BuscarEdicaoSaidaDTO> {
    const edicao = await this.edicaoRepository.buscarPorId(id);
    if (!edicao) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    const prorrogacoes = await this.edicaoRepository.listarProrrogacoes(id);

    return {
      ...edicaoParaSaida(edicao),
      prorrogacoes: prorrogacoes.map((prorrogacao) => ({
        id: prorrogacao.id,
        data_fim_cadastro_anterior: diaCivilDeColunaDate(prorrogacao.data_fim_cadastro_anterior),
        data_fim_cadastro_nova: diaCivilDeColunaDate(prorrogacao.data_fim_cadastro_nova),
        prorrogada_em: prorrogacao.prorrogada_em,
        id_usuario: prorrogacao.id_usuario,
        nome_usuario: prorrogacao.nome_usuario,
      })),
    };
  }
}
