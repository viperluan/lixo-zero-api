const FUSO = 'America/Sao_Paulo';

export function diaCivilNoFuso(instante: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instante);

  const ano = partes.find((parte) => parte.type === 'year')?.value;
  const mes = partes.find((parte) => parte.type === 'month')?.value;
  const dia = partes.find((parte) => parte.type === 'day')?.value;

  if (!ano || !mes || !dia) throw new Error('Data inválida.');

  return `${ano}-${mes}-${dia}`;
}

export function anoCivilAtual(instante = new Date()): number {
  return Number(diaCivilNoFuso(instante).slice(0, 4));
}

/** Dia gravado em coluna DATE. O Prisma devolve meia-noite UTC, sem converter fuso. */
export function diaCivilDeColunaDate(data: Date): string {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(data.getUTCDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

export function parseDiaCivil(valor: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) throw new Error('Data inválida.');

  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    throw new Error('Data inválida.');
  }

  return data;
}

export function diaCivilDaEntrada(valor: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    parseDiaCivil(valor);
    return valor;
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) throw new Error('Data inválida.');

  return diaCivilNoFuso(data);
}

export function intervaloDoDiaCivil(dia: string): { inicio: Date; fim: Date } {
  parseDiaCivil(dia);

  return {
    inicio: instanteNoFuso(dia, '00:00:00.000'),
    fim: instanteNoFuso(dia, '23:59:59.999'),
  };
}

function instanteNoFuso(dia: string, horario: string): Date {
  const referencia = new Date(`${dia}T${horario}Z`);
  const nome = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO,
    timeZoneName: 'longOffset',
  })
    .formatToParts(referencia)
    .find((parte) => parte.type === 'timeZoneName')?.value;

  const deslocamento = nome?.match(/GMT([+-]\d{2}:\d{2})/)?.[1] ?? '-03:00';

  return new Date(`${dia}T${horario}${deslocamento}`);
}
