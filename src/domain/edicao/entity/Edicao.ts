import { v4 as gerarUuid } from 'uuid';
import { ERRO_PRORROGACAO_NAO_AVANCA, erroDatasForaDoAno } from '../erros';

export type EdicaoProps = {
  id: string;
  ano: number;
  data_inicio_cadastro: Date;
  data_fim_cadastro: Date;
  data_inicio_realizacao: Date;
  data_fim_realizacao: Date;
  inscricoes_abertas: boolean;
  vigente: boolean;
};

export type IntervaloEdicaoProps = {
  data_inicio_cadastro: string;
  data_fim_cadastro: string;
  data_inicio_realizacao: string;
  data_fim_realizacao: string;
};

export type NovaEdicaoProps = IntervaloEdicaoProps & {
  ano: number;
  inscricoes_abertas: boolean;
  vigente: boolean;
};

export default class Edicao {
  private constructor(private readonly props: EdicaoProps) {}

  public static criarNovaEdicao(entrada: NovaEdicaoProps) {
    if (!Number.isInteger(entrada.ano) || entrada.ano < 2000 || entrada.ano > 2100) {
      throw new Error('O ano da edição é inválido.');
    }

    if (typeof entrada.inscricoes_abertas !== 'boolean') {
      throw new Error('Informe inscricoes_abertas como verdadeiro ou falso.');
    }

    if (typeof entrada.vigente !== 'boolean') {
      throw new Error('Informe vigente como verdadeiro ou falso.');
    }

    const datas = this.montarIntervalos(entrada, entrada.ano);

    return new Edicao({
      id: gerarUuid(),
      ano: entrada.ano,
      inscricoes_abertas: entrada.inscricoes_abertas,
      vigente: entrada.vigente,
      ...datas,
    });
  }

  public static carregarEdicaoExistente(props: EdicaoProps) {
    return new Edicao(props);
  }

  public static montarIntervalos(entrada: IntervaloEdicaoProps, ano: number) {
    const data_inicio_cadastro = exigirDia(
      entrada.data_inicio_cadastro,
      'A data de início do cadastro é inválida.'
    );
    const data_fim_cadastro = exigirDia(
      entrada.data_fim_cadastro,
      'A data de fim do cadastro é inválida.'
    );
    const data_inicio_realizacao = exigirDia(
      entrada.data_inicio_realizacao,
      'A data de início da realização é inválida.'
    );
    const data_fim_realizacao = exigirDia(
      entrada.data_fim_realizacao,
      'A data de fim da realização é inválida.'
    );

    exigirDiasNoAno(ano, [
      data_inicio_cadastro,
      data_fim_cadastro,
      data_inicio_realizacao,
      data_fim_realizacao,
    ]);

    if (data_inicio_cadastro > data_fim_cadastro) {
      throw new Error('A data de início do cadastro deve ser anterior ou igual à data de fim.');
    }

    if (data_inicio_realizacao > data_fim_realizacao) {
      throw new Error('A data de início da realização deve ser anterior ou igual à data de fim.');
    }

    return {
      data_inicio_cadastro: parseDia(data_inicio_cadastro),
      data_fim_cadastro: parseDia(data_fim_cadastro),
      data_inicio_realizacao: parseDia(data_inicio_realizacao),
      data_fim_realizacao: parseDia(data_fim_realizacao),
    };
  }

  public static validarNovaDataFimCadastro(fimAtual: Date, fimNovo: string, ano: number): Date {
    const nova = exigirDia(fimNovo, 'A data de fim do cadastro é inválida.');
    exigirDiasNoAno(ano, [nova]);

    if (nova <= diaDaColuna(fimAtual)) {
      throw new Error(ERRO_PRORROGACAO_NAO_AVANCA);
    }

    return parseDia(nova);
  }

  public cadastroAberto(diaHoje: string): boolean {
    if (!this.inscricoes_abertas) return false;

    return (
      diaHoje >= diaDaColuna(this.data_inicio_cadastro) &&
      diaHoje <= diaDaColuna(this.data_fim_cadastro)
    );
  }

  public cobreRealizacao(dia: string): boolean {
    return (
      dia >= diaDaColuna(this.data_inicio_realizacao) &&
      dia <= diaDaColuna(this.data_fim_realizacao)
    );
  }

  public get id(): string {
    return this.props.id;
  }

  public get ano(): number {
    return this.props.ano;
  }

  public get data_inicio_cadastro(): Date {
    return this.props.data_inicio_cadastro;
  }

  public get data_fim_cadastro(): Date {
    return this.props.data_fim_cadastro;
  }

  public get data_inicio_realizacao(): Date {
    return this.props.data_inicio_realizacao;
  }

  public get data_fim_realizacao(): Date {
    return this.props.data_fim_realizacao;
  }

  public get inscricoes_abertas(): boolean {
    return this.props.inscricoes_abertas;
  }

  public get vigente(): boolean {
    return this.props.vigente;
  }
}

function exigirDiasNoAno(ano: number, dias: string[]): void {
  if (dias.some((dia) => Number(dia.slice(0, 4)) !== ano)) {
    throw new Error(erroDatasForaDoAno(ano));
  }
}

function exigirDia(valor: string, mensagem: string): string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new Error(mensagem);
  }

  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    throw new Error(mensagem);
  }

  return valor;
}

function diaDaColuna(data: Date): string {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(data.getUTCDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function parseDia(valor: string): Date {
  const [ano, mes, dia] = valor.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}
