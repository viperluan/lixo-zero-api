const TAMANHO_CPF = 11;
const TAMANHO_CNPJ = 14;

export function mascararCpfCnpj(cpfCnpj: string): string {
  const digitos = cpfCnpj.replace(/\D/g, '');

  if (digitos.length === TAMANHO_CPF) {
    return `${digitos.slice(0, 3)}.***.***-${digitos.slice(9)}`;
  }

  if (digitos.length === TAMANHO_CNPJ) {
    return `${digitos.slice(0, 2)}.***.***/****-${digitos.slice(12)}`;
  }

  return '***';
}
