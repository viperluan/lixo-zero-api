/**
 * Seed de desenvolvimento da 7a Semana Lixo Zero (17 a 26/10/2026).
 *
 * Standalone de proposito: importa apenas `@prisma/client` e `bcrypt`, sem o
 * alias `@/`, porque o runner do Dockerfile copia `prisma/` e `node_modules`
 * mas nao `src/`. Roda com `npx tsx prisma/seed.ts` dentro do container.
 *
 * Idempotente: todo registro tem UUID fixo e entra por `upsert`. Executar duas
 * vezes nao duplica nada e nenhum dado e apagado.
 *
 * Grava direto pelo Prisma, contornando a entidade `Acao` — de proposito:
 * `validarDataAcao()` recusa data no passado, e o seed precisa de acoes
 * historicas para exercitar o filtro de "proximas acoes" do front.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Mesmo custo usado por `Usuario.criptografarSenha()`. */
const CUSTO_BCRYPT = 10;

/** Espelham src/domain/acao/enum/ — repetidos aqui para manter o seed standalone. */
const Situacao = { Pendente: '0', Aprovada: '1', Reprovada: '2' } as const;
const Forma = { Online: '0', Presencial: '1', Hibrida: '2' } as const;
const Publico = { Interno: '0', Externo: '1' } as const;
/** Usuario.tipo e invertido em relacao a Situacao: '0' e o administrador. */
const Tipo = { Admin: '0', Comum: '1' } as const;

const EDICAO = {
  id: 'ed1c0001-0000-4000-8000-000000000001',
  ano: 2026,
  data_inicio_cadastro: new Date('2026-01-01T00:00:00.000Z'),
  data_fim_cadastro: new Date('2026-10-16T00:00:00.000Z'),
  data_inicio_realizacao: new Date('2026-08-22T00:00:00.000Z'),
  data_fim_realizacao: new Date('2026-10-26T00:00:00.000Z'),
  inscricoes_abertas: false,
  vigente: false,
};

const USUARIOS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    nome: 'Administradora Lixo Zero',
    email: 'admin@lixozero.dev',
    senha: 'Admin@123',
    cpf_cnpj: '11122233344',
    tipo: Tipo.Admin,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    nome: 'Joana Organizadora',
    email: 'joana@lixozero.dev',
    senha: 'Joana@123',
    cpf_cnpj: '55566677788',
    tipo: Tipo.Comum,
  },
];

const CATEGORIAS = [
  { id: 'aaaaaaa1-0000-4000-8000-000000000001', descricao: 'Oficina' },
  { id: 'aaaaaaa1-0000-4000-8000-000000000002', descricao: 'Palestra' },
  { id: 'aaaaaaa1-0000-4000-8000-000000000003', descricao: 'Mutirão' },
  { id: 'aaaaaaa1-0000-4000-8000-000000000004', descricao: 'Feira de Trocas' },
  { id: 'aaaaaaa1-0000-4000-8000-000000000005', descricao: 'Roda de Conversa' },
];

const [ADMIN, COMUM] = USUARIOS;
const [OFICINA, PALESTRA, MUTIRAO, FEIRA, RODA] = CATEGORIAS;

/**
 * Offset -03:00 explicito: o horario exibido e o pretendido em America/Sao_Paulo
 * independente do TZ de quem roda o seed.
 */
const ACOES = [
  // --- Passado: existem para exercitar o recorte de "proximas acoes" da home.
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000001',
    titulo_acao: 'Mutirão de limpeza do Arroio Tega',
    descricao_acao:
      'Ação de limpeza das margens do Arroio Tega com coleta seletiva e pesagem dos resíduos recolhidos.',
    data_acao: '2026-08-22T09:00:00-03:00',
    forma_realizacao_acao: Forma.Presencial,
    nome_local_acao: 'Margens do Arroio Tega',
    endereco_local_acao: 'Rua Ítalo Victor Bersani, s/n — Bairro Jardelino Ramos',
    situacao_acao: Situacao.Aprovada,
    id_categoria: MUTIRAO.id,
    numero_organizadores_acao: 18,
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000002',
    titulo_acao: 'Palestra: o que é uma cidade Lixo Zero',
    descricao_acao:
      'Introdução ao conceito Lixo Zero e apresentação dos resultados das edições anteriores em Caxias do Sul.',
    data_acao: '2026-09-05T19:00:00-03:00',
    forma_realizacao_acao: Forma.Online,
    link_divulgacao_acesso_acao: 'https://meet.google.com/lixo-zero-abertura',
    situacao_acao: Situacao.Aprovada,
    id_categoria: PALESTRA.id,
    numero_organizadores_acao: 4,
  },

  // --- Proximas semanas.
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000003',
    titulo_acao: 'Oficina de compostagem doméstica',
    descricao_acao:
      'Montagem de uma composteira caseira com material reaproveitado. Cada participante leva a sua para casa.',
    data_acao: '2026-09-19T14:00:00-03:00',
    forma_realizacao_acao: Forma.Presencial,
    nome_local_acao: 'Centro Comunitário São Ciro',
    endereco_local_acao: 'Rua Ângelo Chiarello, 240 — São Ciro',
    link_para_inscricao_acao: 'https://forms.gle/oficina-compostagem',
    situacao_acao: Situacao.Aprovada,
    id_categoria: OFICINA.id,
    numero_organizadores_acao: 6,
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000004',
    titulo_acao: 'Roda de conversa: consumo consciente',
    descricao_acao:
      'Encontro aberto sobre hábitos de consumo, desperdício de alimentos e alternativas ao descartável.',
    data_acao: '2026-09-24T19:30:00-03:00',
    forma_realizacao_acao: Forma.Hibrida,
    nome_local_acao: 'Biblioteca Pública Municipal',
    endereco_local_acao: 'Praça Dante Alighieri, 50 — Centro',
    link_divulgacao_acesso_acao: 'https://meet.google.com/lixo-zero-consumo',
    situacao_acao: Situacao.Aprovada,
    id_categoria: RODA.id,
    numero_organizadores_acao: 5,
  },

  // --- 7a Semana Lixo Zero: 17 a 26 de outubro de 2026.
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000005',
    titulo_acao: 'Abertura da 7ª Semana Lixo Zero',
    descricao_acao:
      'Cerimônia de abertura com apresentação da programação completa e homenagem aos catadores da cidade.',
    data_acao: '2026-10-17T09:00:00-03:00',
    forma_realizacao_acao: Forma.Presencial,
    nome_local_acao: 'Praça Dante Alighieri',
    endereco_local_acao: 'Praça Dante Alighieri, s/n — Centro',
    situacao_acao: Situacao.Aprovada,
    id_categoria: PALESTRA.id,
    numero_organizadores_acao: 22,
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000006',
    titulo_acao: 'Oficina de reaproveitamento de alimentos',
    descricao_acao:
      'Preparo de receitas com cascas, talos e sementes que normalmente vão para o lixo. Degustação ao final.',
    data_acao: '2026-10-17T14:00:00-03:00',
    forma_realizacao_acao: Forma.Presencial,
    nome_local_acao: 'Cozinha Escola do SENAC',
    endereco_local_acao: 'Rua Sinimbu, 1901 — Centro',
    link_para_inscricao_acao: 'https://forms.gle/oficina-reaproveitamento',
    situacao_acao: Situacao.Aprovada,
    id_categoria: OFICINA.id,
    numero_organizadores_acao: 8,
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000007',
    titulo_acao: 'Feira de trocas de roupas e livros',
    descricao_acao:
      'Traga o que não usa mais e leve o que precisa. Sem dinheiro envolvido — o que sobra vai para doação.',
    data_acao: '2026-10-19T10:00:00-03:00',
    forma_realizacao_acao: Forma.Presencial,
    nome_local_acao: 'Parque dos Macaquinhos',
    endereco_local_acao: 'Rua Os Dezoito do Forte, s/n — Centro',
    situacao_acao: Situacao.Pendente,
    id_categoria: FEIRA.id,
    numero_organizadores_acao: 10,
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000008',
    titulo_acao: 'Live: descarte correto do óleo de cozinha',
    descricao_acao:
      'Transmissão sobre os pontos de coleta da cidade e o que acontece com o óleo depois de entregue.',
    data_acao: '2026-10-21T20:00:00-03:00',
    forma_realizacao_acao: Forma.Online,
    link_divulgacao_acesso_acao: 'https://youtube.com/live/lixo-zero-oleo',
    situacao_acao: Situacao.Aprovada,
    id_categoria: PALESTRA.id,
    numero_organizadores_acao: 3,
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-000000000009',
    titulo_acao: 'Mutirão de limpeza do Parque Cinquentenário',
    descricao_acao:
      'Coleta de resíduos nas trilhas do parque, com separação e pesagem do material recolhido.',
    data_acao: '2026-10-22T08:30:00-03:00',
    forma_realizacao_acao: Forma.Presencial,
    nome_local_acao: 'Parque Cinquentenário',
    endereco_local_acao: 'Rua Matteo Gianella, 800 — Panazzolo',
    link_para_inscricao_acao: 'https://forms.gle/mutirao-cinquentenario',
    situacao_acao: Situacao.Aprovada,
    id_categoria: MUTIRAO.id,
    numero_organizadores_acao: 30,
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-00000000000a',
    titulo_acao: 'Oficina de papel reciclado artesanal',
    descricao_acao:
      'Produção de papel reciclado a partir de sobras de escritório, com uso de formas artesanais.',
    data_acao: '2026-10-22T15:00:00-03:00',
    forma_realizacao_acao: Forma.Presencial,
    nome_local_acao: 'Ateliê Casa Verde',
    endereco_local_acao: 'Rua Marquês do Herval, 1502 — Centro',
    situacao_acao: Situacao.Pendente,
    id_categoria: OFICINA.id,
    numero_organizadores_acao: 5,
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-00000000000b',
    titulo_acao: 'Seminário de logística reversa',
    descricao_acao:
      'Encontro com empresas locais sobre responsabilidade compartilhada pelo ciclo de vida dos produtos.',
    data_acao: '2026-10-23T14:00:00-03:00',
    forma_realizacao_acao: Forma.Hibrida,
    nome_local_acao: 'Auditório da UCS — Bloco 46',
    endereco_local_acao: 'Rua Francisco Getúlio Vargas, 1130 — Petrópolis',
    link_divulgacao_acesso_acao: 'https://meet.google.com/lixo-zero-logistica',
    tipo_publico_acao: Publico.Interno,
    situacao_acao: Situacao.Reprovada,
    id_categoria: PALESTRA.id,
    numero_organizadores_acao: 12,
  },
  {
    id: 'bbbbbbb1-0000-4000-8000-00000000000c',
    titulo_acao: 'Encerramento: piquenique sem desperdício',
    descricao_acao:
      'Piquenique coletivo com louça reutilizável e zero descartáveis, fechando a programação da semana.',
    data_acao: '2026-10-26T11:00:00-03:00',
    forma_realizacao_acao: Forma.Presencial,
    nome_local_acao: 'Parque Getúlio Vargas',
    endereco_local_acao: 'Av. Rubem Bento Alves, s/n — Cinquentenário',
    situacao_acao: Situacao.Aprovada,
    id_categoria: FEIRA.id,
    numero_organizadores_acao: 15,
  },
];

async function semearUsuarios() {
  for (const { senha, ...usuario } of USUARIOS) {
    const dados = {
      ...usuario,
      senha: bcrypt.hashSync(senha, CUSTO_BCRYPT),
      status: true,
    };

    await prisma.usuario.upsert({
      where: { id: usuario.id },
      update: dados,
      create: dados,
    });
  }

  console.log(`  ${USUARIOS.length} usuários`);
}

async function semearCategorias() {
  for (const categoria of CATEGORIAS) {
    await prisma.categoria.upsert({
      where: { id: categoria.id },
      update: categoria,
      create: categoria,
    });
  }

  console.log(`  ${CATEGORIAS.length} categorias`);
}

async function semearEdicao() {
  const { id, ...dados } = EDICAO;

  await prisma.edicao.upsert({
    where: { id },
    update: dados,
    create: EDICAO,
  });

  console.log('  1 edição');
}

async function semearAcoes() {
  for (const acao of ACOES) {
    const dados = {
      ...acao,
      data_acao: new Date(acao.data_acao),
      nome_organizador: COMUM.nome,
      celular: '54999887766',
      // Campos obrigatorios no schema mas opcionais por forma de realizacao:
      // uma acao presencial nao tem link de acesso, uma online nao tem endereco.
      link_divulgacao_acesso_acao: acao.link_divulgacao_acesso_acao ?? '',
      link_para_inscricao_acao: acao.link_para_inscricao_acao ?? '',
      nome_local_acao: acao.nome_local_acao ?? '',
      endereco_local_acao: acao.endereco_local_acao ?? '',
      informacoes_acao:
        'Atividade gratuita e aberta à comunidade. Não é necessário levar material.',
      orientacao_divulgacao_acao: 'Pode divulgar nas redes sociais da campanha.',
      tipo_publico_acao: acao.tipo_publico_acao ?? Publico.Externo,
      id_usuario_responsavel: COMUM.id,
      id_usuario_alteracao: ADMIN.id,
      id_edicao: EDICAO.id,
    };

    await prisma.acao.upsert({
      where: { id: acao.id },
      update: dados,
      create: dados,
    });
  }

  const porSituacao = ACOES.reduce<Record<string, number>>((contagem, { situacao_acao }) => {
    contagem[situacao_acao] = (contagem[situacao_acao] ?? 0) + 1;
    return contagem;
  }, {});

  console.log(
    `  ${ACOES.length} ações (${porSituacao[Situacao.Aprovada] ?? 0} aprovadas, ` +
      `${porSituacao[Situacao.Pendente] ?? 0} pendentes, ` +
      `${porSituacao[Situacao.Reprovada] ?? 0} reprovada)`
  );
}

async function main() {
  console.log('Semeando dados da 7ª Semana Lixo Zero...');

  await semearUsuarios();
  await semearCategorias();
  await semearEdicao();
  await semearAcoes();

  console.log(`\nAdministrador: ${ADMIN.email} / Admin@123`);
  console.log(`Usuário comum: ${COMUM.email} / Joana@123`);
}

main()
  .catch((erro) => {
    console.error('Falha ao semear:', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
