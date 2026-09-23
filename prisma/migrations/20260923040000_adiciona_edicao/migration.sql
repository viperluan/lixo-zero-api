-- CreateTable
CREATE TABLE "Edicao" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "data_inicio_cadastro" DATE NOT NULL,
    "data_fim_cadastro" DATE NOT NULL,
    "data_inicio_realizacao" DATE NOT NULL,
    "data_fim_realizacao" DATE NOT NULL,
    "inscricoes_abertas" BOOLEAN NOT NULL DEFAULT false,
    "vigente" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Edicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProrrogacaoEdicao" (
    "id" TEXT NOT NULL,
    "id_edicao" TEXT NOT NULL,
    "data_fim_cadastro_anterior" DATE NOT NULL,
    "data_fim_cadastro_nova" DATE NOT NULL,
    "prorrogada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" TEXT NOT NULL,

    CONSTRAINT "ProrrogacaoEdicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Edicao_ano_key" ON "Edicao"("ano");

-- Uma única edição vigente. O schema Prisma não declara índice parcial.
CREATE UNIQUE INDEX "Edicao_vigente_unica" ON "Edicao"("vigente") WHERE "vigente" = true;

-- Backfill: uma edição por ano civil de data_acao, em America/Sao_Paulo.
-- Cadastro e realização cobrem os dias já gravados. Nenhuma fica vigente.
INSERT INTO "Edicao" (
    "id",
    "ano",
    "data_inicio_cadastro",
    "data_fim_cadastro",
    "data_inicio_realizacao",
    "data_fim_realizacao",
    "inscricoes_abertas",
    "vigente"
)
SELECT
    gen_random_uuid()::text,
    anos.ano,
    MIN(anos.dia_cadastro),
    MAX(anos.dia_cadastro),
    MIN(anos.dia_acao),
    MAX(anos.dia_acao),
    false,
    false
FROM (
    SELECT
        EXTRACT(YEAR FROM (("data_acao" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo'))::int AS ano,
        (("data_acao" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date AS dia_acao,
        (("data_cadastro" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::date AS dia_cadastro
    FROM "Acao"
) AS anos
GROUP BY anos.ano;

-- AlterTable
ALTER TABLE "Acao" ADD COLUMN "id_edicao" TEXT;

UPDATE "Acao" AS acao
SET "id_edicao" = edicao."id"
FROM "Edicao" AS edicao
WHERE edicao."ano" = EXTRACT(YEAR FROM ((acao."data_acao" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo'))::int;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Acao" WHERE "id_edicao" IS NULL) THEN
        RAISE EXCEPTION 'Há ações sem edição após o backfill. A migration foi interrompida.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "Acao"
        GROUP BY "titulo_acao", "id_edicao"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Há títulos de ação repetidos na mesma edição. A migration foi interrompida.';
    END IF;
END $$;

ALTER TABLE "Acao" ALTER COLUMN "id_edicao" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Acao_titulo_acao_id_edicao_key" ON "Acao"("titulo_acao", "id_edicao");

-- CreateIndex
CREATE INDEX "Acao_id_edicao_situacao_acao_data_acao_idx" ON "Acao"("id_edicao", "situacao_acao", "data_acao");

-- CreateIndex
CREATE INDEX "ProrrogacaoEdicao_id_edicao_prorrogada_em_idx" ON "ProrrogacaoEdicao"("id_edicao", "prorrogada_em");

-- CreateIndex
CREATE INDEX "ProrrogacaoEdicao_id_usuario_idx" ON "ProrrogacaoEdicao"("id_usuario");

-- AddForeignKey
ALTER TABLE "Acao" ADD CONSTRAINT "Acao_id_edicao_fkey" FOREIGN KEY ("id_edicao") REFERENCES "Edicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProrrogacaoEdicao" ADD CONSTRAINT "ProrrogacaoEdicao_id_edicao_fkey" FOREIGN KEY ("id_edicao") REFERENCES "Edicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProrrogacaoEdicao" ADD CONSTRAINT "ProrrogacaoEdicao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
