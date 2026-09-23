import Edicao from '@/domain/edicao/entity/Edicao';
import { diaCivilDeColunaDate, diaCivilNoFuso } from '@/shared/utils/diaCivil';

export type EdicaoSaidaDTO = {
  id: string;
  ano: number;
  data_inicio_cadastro: string;
  data_fim_cadastro: string;
  data_inicio_realizacao: string;
  data_fim_realizacao: string;
  inscricoes_abertas: boolean;
  cadastro_aberto: boolean;
  vigente: boolean;
};

export function edicaoParaSaida(
  edicao: Edicao,
  diaHoje = diaCivilNoFuso(new Date())
): EdicaoSaidaDTO {
  return {
    id: edicao.id,
    ano: edicao.ano,
    data_inicio_cadastro: diaCivilDeColunaDate(edicao.data_inicio_cadastro),
    data_fim_cadastro: diaCivilDeColunaDate(edicao.data_fim_cadastro),
    data_inicio_realizacao: diaCivilDeColunaDate(edicao.data_inicio_realizacao),
    data_fim_realizacao: diaCivilDeColunaDate(edicao.data_fim_realizacao),
    inscricoes_abertas: edicao.inscricoes_abertas,
    cadastro_aberto: edicao.cadastroAberto(diaHoje),
    vigente: edicao.vigente,
  };
}
