import { Usecase } from '../usecase';
import IAcaoRepository from '../../../domain/acao/repository/IAcaoRepository';
import Acao from '../../../domain/acao/entity/Acao';

export type AtualizarAcaoEntradaDTO = {
  id: string;
  campos: Pick<Acao, 'situacao_acao' | 'id_usuario_alteracao'>;
};

export type AtualizarAcaoSaidaDTO = {
  id: string;
  celular: string;
  nome_organizador: string;
  link_organizador: string;
  titulo_acao: string;
  descricao_acao: string;
  data_acao: Date;
  forma_realizacao_acao: string;
  local_acao: string;
  numero_organizadores_acao: number;
  receber_informacao_patrocinio: boolean;
  data_cadastro: Date;
  data_atualizacao: Date;
  situacao_acao: string;
  id_usuario_responsavel: string;
  id_categoria: string;
  id_usuario_alteracao: string;
};

export default class AtualizarAcao
  implements Usecase<AtualizarAcaoEntradaDTO, AtualizarAcaoSaidaDTO>
{
  constructor(private readonly acaoRepository: IAcaoRepository) {}

  async executar({ id, campos }: AtualizarAcaoEntradaDTO): Promise<AtualizarAcaoSaidaDTO> {
    const acao = await this.acaoRepository.buscarPorId(id);

    if (!acao) throw new Error('Ação não encontrada!');

    const acaoAtualizada = await this.acaoRepository.atualizar(id, campos);

    return this.objetoDeSaida(acaoAtualizada);
  }

  private objetoDeSaida({
    id,
    celular,
    nome_organizador,
    link_organizador,
    titulo_acao,
    descricao_acao,
    data_acao,
    forma_realizacao_acao,
    local_acao,
    numero_organizadores_acao,
    receber_informacao_patrocinio,
    data_cadastro,
    data_atualizacao,
    situacao_acao,
    id_usuario_responsavel,
    id_categoria,
    id_usuario_alteracao,
  }: Acao): AtualizarAcaoSaidaDTO {
    return {
      id,
      celular,
      nome_organizador,
      link_organizador,
      titulo_acao,
      descricao_acao,
      data_acao,
      forma_realizacao_acao,
      local_acao,
      numero_organizadores_acao,
      receber_informacao_patrocinio,
      data_cadastro,
      data_atualizacao,
      situacao_acao,
      id_usuario_responsavel,
      id_categoria,
      id_usuario_alteracao,
    };
  }
}
