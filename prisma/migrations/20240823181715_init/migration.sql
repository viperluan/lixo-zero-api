-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "tipo" VARCHAR(2) NOT NULL,
    "cpf_cnpj" VARCHAR(14) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acao" (
    "id" TEXT NOT NULL,
    "celular" VARCHAR(11) NOT NULL,
    "nome_organizador" VARCHAR(60) NOT NULL,
    "link_organizador" TEXT NOT NULL,
    "titulo_acao" TEXT NOT NULL,
    "descricao_acao" TEXT NOT NULL,
    "data_acao" TIMESTAMP(3) NOT NULL,
    "forma_realizacao_acao" VARCHAR(2) NOT NULL,
    "local_acao" TEXT NOT NULL,
    "numero_organizadores_acao" INTEGER NOT NULL,
    "receber_informacao_patrocionio" BOOLEAN NOT NULL DEFAULT false,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,
    "situacao_acao" VARCHAR(2) NOT NULL,
    "id_usuario_responsavel" TEXT NOT NULL,
    "id_categoria" TEXT NOT NULL,
    "id_usuario_alteracao" TEXT,

    CONSTRAINT "Acao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patrocinador" (
    "id" TEXT NOT NULL,
    "celular" VARCHAR(11) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "descricao" TEXT NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,
    "situacao" VARCHAR(2) NOT NULL,
    "id_cota" TEXT NOT NULL,
    "id_usuario_alteracao" TEXT,
    "id_usuario_patrocinio" TEXT NOT NULL,

    CONSTRAINT "Patrocinador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cota" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "Cota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cpf_cnpj_key" ON "Usuario"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Acao_id_key" ON "Acao"("id");

-- AddForeignKey
ALTER TABLE "Acao" ADD CONSTRAINT "Acao_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acao" ADD CONSTRAINT "Acao_id_usuario_alteracao_fkey" FOREIGN KEY ("id_usuario_alteracao") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acao" ADD CONSTRAINT "Acao_id_usuario_responsavel_fkey" FOREIGN KEY ("id_usuario_responsavel") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patrocinador" ADD CONSTRAINT "Patrocinador_id_usuario_alteracao_fkey" FOREIGN KEY ("id_usuario_alteracao") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patrocinador" ADD CONSTRAINT "Patrocinador_id_usuario_patrocinio_fkey" FOREIGN KEY ("id_usuario_patrocinio") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patrocinador" ADD CONSTRAINT "Patrocinador_id_cota_fkey" FOREIGN KEY ("id_cota") REFERENCES "Cota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
