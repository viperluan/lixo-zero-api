import Acao from '@/domain/acao/entity/Acao';
import IAcaoRepository from '@/domain/acao/repository/IAcaoRepository';
import { sanitizarListaAcoesResposta } from '@/shared/utils/sanitizarAcaoResposta';
import { intervaloDoDiaCivil } from '@/shared/utils/diaCivil';
import { Usecase } from '../usecase';

export type ListarAcoesPorIntervaloDataEntradaDTO = {
  dataInicial: string;
  dataFinal: string;
  situacao?: string;
  id_edicao?: string;
  sanitizarSaida?: boolean;
};

type CategoriaSaidaType = {
  descricao?: string;
};

type UsuarioResponsavelSaidaType = {
  nome?: string;
  email?: string;
};

type UsuarioAlteracaoSaidaType = {
  nome?: string;
  email?: string;
};

export type ListarAcoesPorIntervaloDataSaidaDTO = {
  id: string;
  nome_organizador: string;
  celular: string;
  titulo_acao: string;
  descricao_acao: string;
  data_acao: Date;
  forma_realizacao_acao: string;
  link_divulgacao_acesso_acao: string;
  nome_local_acao: string;
  endereco_local_acao: string;
  informacoes_acao: string;
  link_para_inscricao_acao: string;
  tipo_publico_acao: string;
  orientacao_divulgacao_acao: string;
  numero_organizadores_acao: number;
  situacao_acao: string;
  data_cadastro: Date;
  data_atualizacao: Date;
  categoria?: CategoriaSaidaType;
  usuario_responsavel?: UsuarioResponsavelSaidaType;
  usuario_alteracao?: UsuarioAlteracaoSaidaType;
};

export default class ListarAcoesPorIntervaloData
  implements Usecase<ListarAcoesPorIntervaloDataEntradaDTO, ListarAcoesPorIntervaloDataSaidaDTO[]>
{
  constructor(private readonly acaoRepository: IAcaoRepository) {}

  public async executar({
    dataInicial,
    dataFinal,
    situacao,
    id_edicao,
    sanitizarSaida = false,
  }: ListarAcoesPorIntervaloDataEntradaDTO): Promise<ListarAcoesPorIntervaloDataSaidaDTO[]> {
    const objetoDataInicial = limiteDoIntervalo(dataInicial, 'inicio');
    const objetoDataFinal = limiteDoIntervalo(dataFinal, 'fim');

    this.validarDatas(objetoDataInicial, objetoDataFinal);

    const listaAcoes = await this.acaoRepository.listarPorIntervaloData(
      objetoDataInicial,
      objetoDataFinal,
      situacao,
      id_edicao
    );

    return this.objetoDeSaida(listaAcoes, sanitizarSaida);
  }

  private validarDatas(dataInicial: Date, dataFinal: Date) {
    if (isNaN(dataInicial.getTime())) {
      throw new Error('Data inicial inválida.');
    }

    if (isNaN(dataFinal.getTime())) {
      throw new Error('Data final inválida.');
    }

    if (dataInicial > dataFinal) {
      throw new Error('A data de início deve ser anterior à data de fim.');
    }
  }

  private objetoDeSaida(acoes: Acao[] | null, sanitizarSaida: boolean) {
    if (!acoes) {
      return [];
    }

    const acoesSaida: ListarAcoesPorIntervaloDataSaidaDTO[] = acoes.map(
      ({
        id,
        nome_organizador,
        celular,
        titulo_acao,
        descricao_acao,
        data_acao,
        forma_realizacao_acao_texto,
        link_divulgacao_acesso_acao,
        nome_local_acao,
        endereco_local_acao,
        informacoes_acao,
        link_para_inscricao_acao,
        tipo_publico_acao_texto,
        orientacao_divulgacao_acao,
        numero_organizadores_acao,
        situacao_acao,
        data_cadastro,
        data_atualizacao,
        categoria,
        usuario_responsavel,
        usuario_alteracao,
      }) => ({
        id,
        nome_organizador,
        celular,
        titulo_acao,
        descricao_acao,
        data_acao,
        forma_realizacao_acao: forma_realizacao_acao_texto,
        link_divulgacao_acesso_acao,
        nome_local_acao,
        endereco_local_acao,
        informacoes_acao,
        link_para_inscricao_acao,
        tipo_publico_acao: tipo_publico_acao_texto,
        orientacao_divulgacao_acao,
        numero_organizadores_acao,
        situacao_acao,
        data_cadastro,
        data_atualizacao,
        categoria,
        usuario_responsavel,
        usuario_alteracao,
      })
    );

    return sanitizarSaida ? sanitizarListaAcoesResposta(acoesSaida) : acoesSaida;
  }
}

function limiteDoIntervalo(valor: string, ponta: 'inicio' | 'fim'): Date {
  const mensagem = ponta === 'inicio' ? 'Data inicial inválida.' : 'Data final inválida.';

  if (typeof valor !== 'string' || !valor) throw new Error(mensagem);

  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    try {
      const intervalo = intervaloDoDiaCivil(valor);
      return ponta === 'inicio' ? intervalo.inicio : intervalo.fim;
    } catch {
      throw new Error(mensagem);
    }
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) throw new Error(mensagem);

  return data;
}
