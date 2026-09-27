import ExcelJS from 'exceljs';
import Acao from '@/domain/acao/entity/Acao';
import IAcaoRepository, { AcaoParaPlanilha } from '@/domain/acao/repository/IAcaoRepository';
import { ERRO_EDICAO_NAO_ENCONTRADA } from '@/domain/edicao/erros';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import ResolverFiltroEdicao from '../edicao/ResolverFiltroEdicao';
import { Usecase } from '../usecase';

const FUSO = 'America/Sao_Paulo';
const VERDE_CAMPANHA = 'FF246352';
const CREME_CAMPANHA = 'FFFFFCE6';
const FAIXA_VERDE = 'FFE7F2EC';
const BRANCO = 'FFFFFFFF';

const COLUNAS = [
  { chave: 'titulo_acao', cabecalho: 'Título da ação', largura: 36 },
  { chave: 'situacao_acao', cabecalho: 'Situação', largura: 14 },
  { chave: 'nome_organizador', cabecalho: 'Nome do Organizador', largura: 28 },
  { chave: 'celular', cabecalho: 'Celular', largura: 16 },
  { chave: 'descricao_acao', cabecalho: 'Descrição da atividade', largura: 40, quebra: true },
  { chave: 'categoria', cabecalho: 'Tipo da atividade', largura: 22 },
  { chave: 'data_acao', cabecalho: 'Data da ação', largura: 20 },
  { chave: 'forma_realizacao_acao', cabecalho: 'Forma de realização', largura: 20 },
  { chave: 'link_divulgacao_acesso_acao', cabecalho: 'Link de divulgação', largura: 32 },
  { chave: 'nome_local_acao', cabecalho: 'Nome do local', largura: 28 },
  { chave: 'endereco_local_acao', cabecalho: 'Endereço do local', largura: 32 },
  { chave: 'informacoes_acao', cabecalho: 'Informações', largura: 36, quebra: true },
  { chave: 'link_para_inscricao_acao', cabecalho: 'Link para inscrição', largura: 32 },
  { chave: 'tipo_publico_acao', cabecalho: 'Tipo de público', largura: 16 },
  {
    chave: 'orientacao_divulgacao_acao',
    cabecalho: 'Descrição sobre divulgação',
    largura: 36,
    quebra: true,
  },
  { chave: 'numero_organizadores_acao', cabecalho: 'Número de organizadores', largura: 24 },
  { chave: 'nome_responsavel', cabecalho: 'Nome usuário responsável', largura: 28 },
  { chave: 'email_responsavel', cabecalho: 'Email usuário responsável', largura: 32 },
] as const;

type ChaveColuna = (typeof COLUNAS)[number]['chave'];
type LinhaPlanilha = Record<ChaveColuna, string | number>;

type AbaPlanilha = {
  nomeAba: string;
  acoes: Acao[];
};

export type ExportarPlanilhaAcoesEntradaDTO = {
  ano?: string;
  id_edicao?: string;
};

export type ExportarPlanilhaAcoesSaidaDTO = {
  buffer: Buffer;
  nomeArquivo: string;
};

export default class ExportarPlanilhaAcoes
  implements Usecase<ExportarPlanilhaAcoesEntradaDTO, ExportarPlanilhaAcoesSaidaDTO>
{
  constructor(
    private readonly acaoRepository: IAcaoRepository,
    private readonly edicaoRepository: IEdicaoRepository
  ) {}

  async executar({
    ano,
    id_edicao,
  }: ExportarPlanilhaAcoesEntradaDTO): Promise<ExportarPlanilhaAcoesSaidaDTO> {
    const filtro = await new ResolverFiltroEdicao(this.edicaoRepository).executar({
      perfil: 'admin',
      ano,
      id_edicao,
    });

    const momento = momentoDoArquivo();

    if (filtro.sem_resultado) {
      return this.gerarArquivo(`acoes-${momento}.xlsx`, [{ nomeAba: 'Ações', acoes: [] }]);
    }

    const linhas = await this.acaoRepository.listarParaPlanilha(filtro.id_edicao);

    if (filtro.id_edicao) {
      const anoEdicao = linhas[0]?.ano ?? (await this.anoDaEdicao(filtro.id_edicao));
      return this.gerarArquivo(`acoes-${anoEdicao}-${momento}.xlsx`, [
        { nomeAba: String(anoEdicao), acoes: linhas.map((linha) => linha.acao) },
      ]);
    }

    const abas = agruparPorAno(linhas);
    if (abas.length === 0) {
      return this.gerarArquivo(`acoes-todas-edicoes-${momento}.xlsx`, [
        { nomeAba: 'Ações', acoes: [] },
      ]);
    }

    return this.gerarArquivo(`acoes-todas-edicoes-${momento}.xlsx`, abas);
  }

  private async anoDaEdicao(idEdicao: string): Promise<number> {
    const edicao = await this.edicaoRepository.buscarPorId(idEdicao);
    if (!edicao) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    return edicao.ano;
  }

  private async gerarArquivo(
    nomeArquivo: string,
    abas: AbaPlanilha[]
  ): Promise<ExportarPlanilhaAcoesSaidaDTO> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CaxiasLixoZero';

    for (const aba of abas) {
      montarAba(workbook, aba);
    }

    const conteudo = await workbook.xlsx.writeBuffer();

    return {
      buffer: Buffer.from(conteudo),
      nomeArquivo,
    };
  }
}

function agruparPorAno(linhas: AcaoParaPlanilha[]): AbaPlanilha[] {
  const abas: AbaPlanilha[] = [];

  for (const linha of linhas) {
    const ultima = abas[abas.length - 1];
    if (!ultima || ultima.nomeAba !== String(linha.ano)) {
      abas.push({ nomeAba: String(linha.ano), acoes: [linha.acao] });
      continue;
    }

    ultima.acoes.push(linha.acao);
  }

  return abas;
}

function montarAba(workbook: ExcelJS.Workbook, aba: AbaPlanilha) {
  const planilha = workbook.addWorksheet(aba.nomeAba);
  const linhas = aba.acoes.map((acao) => linhaDaAcao(acao));

  planilha.addTable({
    name: nomeDaTabela(aba.nomeAba),
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      // Sem nome de tema: o ExcelJS cairia no Medium 2 e o Excel pintaria com a cor de destaque do programa.
      theme: null as unknown as 'TableStyleMedium2',
      showRowStripes: false,
      showColumnStripes: false,
    },
    columns: COLUNAS.map((coluna) => ({
      name: coluna.cabecalho,
      filterButton: true,
      ...('quebra' in coluna && coluna.quebra
        ? { style: { alignment: { wrapText: true, vertical: 'top' as const } } }
        : {}),
    })),
    rows: linhas.map((linha) => COLUNAS.map((coluna) => linha[coluna.chave])),
  });

  COLUNAS.forEach((coluna, indice) => {
    planilha.getColumn(indice + 1).width = coluna.largura;
  });

  pintarFaixas(planilha, linhas.length);
  planilha.views = [{ state: 'frozen', ySplit: 1 }];
}

function pintarFaixas(planilha: ExcelJS.Worksheet, quantidadeLinhas: number) {
  const totalColunas = COLUNAS.length;
  const cabecalho = planilha.getRow(1);

  for (let coluna = 1; coluna <= totalColunas; coluna += 1) {
    const celula = cabecalho.getCell(coluna);
    celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_CAMPANHA } };
    celula.font = { bold: true, color: { argb: CREME_CAMPANHA }, name: 'Calibri' };
    celula.alignment = { vertical: 'middle', wrapText: true };
  }

  for (let indice = 0; indice < quantidadeLinhas; indice += 1) {
    const linha = planilha.getRow(indice + 2);
    const faixa = indice % 2 === 1 ? FAIXA_VERDE : BRANCO;

    for (let coluna = 1; coluna <= totalColunas; coluna += 1) {
      const celula = linha.getCell(coluna);
      celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: faixa } };
    }
  }
}

function nomeDaTabela(nomeAba: string): string {
  const ano = nomeAba.replace(/\D/g, '');
  return ano ? `Acoes${ano}` : 'Acoes';
}

function linhaDaAcao(acao: Acao): LinhaPlanilha {
  return {
    titulo_acao: acao.titulo_acao,
    situacao_acao: acao.situacao_acao_texto,
    nome_organizador: acao.nome_organizador,
    celular: acao.celular,
    descricao_acao: acao.descricao_acao,
    categoria: acao.categoria?.descricao ?? '',
    data_acao: formatarDataHoraAcao(acao.data_acao),
    forma_realizacao_acao: acao.forma_realizacao_acao_texto,
    link_divulgacao_acesso_acao: acao.link_divulgacao_acesso_acao,
    nome_local_acao: acao.nome_local_acao,
    endereco_local_acao: acao.endereco_local_acao,
    informacoes_acao: acao.informacoes_acao,
    link_para_inscricao_acao: acao.link_para_inscricao_acao,
    tipo_publico_acao: acao.tipo_publico_acao_texto,
    orientacao_divulgacao_acao: acao.orientacao_divulgacao_acao,
    numero_organizadores_acao: acao.numero_organizadores_acao,
    nome_responsavel: acao.usuario_responsavel?.nome ?? '',
    email_responsavel: acao.usuario_responsavel?.email ?? '',
  };
}

function momentoDoArquivo(instante = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instante);

  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? '';

  return `${valor('year')}${valor('month')}${valor('day')}${valor('hour')}${valor('minute')}`;
}

function formatarDataHoraAcao(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(data)
    .replace(/\u202f/g, ' ');
}
