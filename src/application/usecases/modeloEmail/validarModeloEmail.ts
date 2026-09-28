import {
  camposConteudo,
  CodigoModeloEmail,
  ConteudoModeloEmail,
  marcadoresAssunto,
} from '@/domain/modeloEmail/modeloEmail';

const LIMITE_ASSUNTO = 200;
const LIMITE_TEXTO = 4000;
const LIMITE_URL = 2000;

export function validarModeloEmail(
  codigo: CodigoModeloEmail,
  assunto: unknown,
  conteudo: unknown
): { assunto: string; conteudo: ConteudoModeloEmail } {
  if (typeof assunto !== 'string' || assunto.trim().length === 0) {
    throw new Error('Informe o assunto do e-mail.');
  }

  const assuntoLimpo = assunto.trim();
  if (assuntoLimpo.length > LIMITE_ASSUNTO || /[\r\n]/.test(assuntoLimpo)) {
    throw new Error('O assunto do e-mail é inválido.');
  }

  const marcadores = assuntoLimpo.match(/\{[a-z0-9_]+\}/g) ?? [];
  const permitidos = marcadoresAssunto(codigo);
  for (const marcador of marcadores) {
    const nome = marcador.slice(1, -1);
    if (!permitidos.includes(nome)) {
      throw new Error(`O assunto não pode usar o marcador ${marcador}.`);
    }
  }

  if (!conteudo || typeof conteudo !== 'object' || Array.isArray(conteudo)) {
    throw new Error('Informe o conteúdo do e-mail.');
  }

  const origem = conteudo as Record<string, unknown>;
  const campos = camposConteudo(codigo);
  const chaves = Object.keys(origem);
  if (chaves.some((chave) => !campos.includes(chave)) || chaves.length !== campos.length) {
    throw new Error('O conteúdo do e-mail tem campos diferentes do modelo.');
  }

  const normalizado: Record<string, string> = {};
  for (const campo of campos) {
    const valor = origem[campo];
    if (typeof valor !== 'string' || valor.trim().length === 0) {
      throw new Error('Preencha todos os campos do e-mail.');
    }

    const limite = campo.startsWith('url_') ? LIMITE_URL : LIMITE_TEXTO;
    const texto = valor.trim();
    if (texto.length > limite) {
      throw new Error('Um dos campos do e-mail passou do tamanho permitido.');
    }

    if (campo.startsWith('url_') && !/^https?:\/\/\S+$/i.test(texto)) {
      throw new Error('O link precisa começar com http:// ou https://.');
    }

    normalizado[campo] = texto;
  }

  return { assunto: assuntoLimpo, conteudo: normalizado as ConteudoModeloEmail };
}

export function aplicarMarcadoresAssunto(assunto: string, valores: Record<string, string>): string {
  return assunto.replace(/\{([a-z0-9_]+)\}/g, (marcador, nome: string) => {
    return valores[nome] ?? marcador;
  });
}
