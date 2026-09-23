import Edicao from '@/domain/edicao/entity/Edicao';
import { ERRO_EDICAO_NAO_ENCONTRADA, ERRO_SO_EDICAO_VIGENTE } from '@/domain/edicao/erros';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { Usecase } from '../usecase';
import { EdicaoSaidaDTO, edicaoParaSaida } from './edicaoSaida';

export type ProrrogarEdicaoEntradaDTO = {
  id: string;
  data_fim_cadastro: string;
  id_usuario: string;
};

export default class ProrrogarEdicao implements Usecase<ProrrogarEdicaoEntradaDTO, EdicaoSaidaDTO> {
  constructor(private readonly edicaoRepository: IEdicaoRepository) {}

  async executar({
    id,
    data_fim_cadastro,
    id_usuario,
  }: ProrrogarEdicaoEntradaDTO): Promise<EdicaoSaidaDTO> {
    const edicao = await this.edicaoRepository.buscarPorId(id);
    if (!edicao) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);
    if (!edicao.vigente) throw new Error(ERRO_SO_EDICAO_VIGENTE);

    const novaData = Edicao.validarNovaDataFimCadastro(edicao.data_fim_cadastro, data_fim_cadastro);
    await this.edicaoRepository.prorrogar(id, novaData, id_usuario);

    const atualizada = await this.edicaoRepository.buscarPorId(id);
    if (!atualizada) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    return edicaoParaSaida(atualizada);
  }
}
