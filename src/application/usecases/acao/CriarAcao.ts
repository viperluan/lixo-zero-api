import Acao from '../../../domain/acao/entity/Acao';
import IAcaoRepository from '../../../domain/acao/repository/IAcaoRepository';
import { Usecase } from '../usecase';

export type CriarAcaoEntradaDTO = {
  celular: string;
  nome_organizador: string;
  link_organizador: string;
  titulo_acao: string;
  descricao_acao: string;
  forma_realizacao_acao: string;
  local_acao: string;
  numero_organizadores_acao: number;
  situacao_acao: string;
  tipo_publico: string;
  orientacao_divulgacao: string;
  data_acao: string;
  id_categoria: string;
  id_usuario_responsavel: string;
  id_usuario_alteracao: string;
};

export type CriarAcaoSaidaDTO = {
  id: string;
};

export default class CriarAcao implements Usecase<CriarAcaoEntradaDTO, CriarAcaoSaidaDTO> {
  constructor(private readonly acaoRepository: IAcaoRepository) {}

  public async executar(entrada: CriarAcaoEntradaDTO): Promise<CriarAcaoSaidaDTO> {
    const tituloExiste = await this.acaoRepository.buscarPorTitulo(entrada.titulo_acao);
    if (tituloExiste) throw new Error('Título já cadastrado.');

    const acao = Acao.criarNovaAcao(entrada);
    await this.acaoRepository.salvar(acao);

    return { id: acao.id };
  }
}
