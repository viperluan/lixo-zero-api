-- CreateTable
CREATE TABLE "acao" (
    "id" SERIAL NOT NULL,
    "id_usuario_responsavel" INTEGER NOT NULL,
    "celular" VARCHAR(11) NOT NULL,
    "nome_organizador" VARCHAR(60) NOT NULL,
    "link_organizador" TEXT NOT NULL,
    "titulo_acao" TEXT NOT NULL,
    "descricao_acao" TEXT NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "data_acao" TIMESTAMP(3) NOT NULL,
    "forma_realizacao_acao" VARCHAR(2) NOT NULL,
    "local_acao" TEXT NOT NULL,
    "numero_organizadores_acao" INTEGER NOT NULL,
    "receber_informacao_patrocionio" BOOLEAN NOT NULL DEFAULT false,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,
    "situacao_acao" VARCHAR(2) NOT NULL,
    "id_usuario_alteracao" INTEGER,

    CONSTRAINT "acao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "acao" ADD CONSTRAINT "acao_id_usuario_responsavel_fkey" FOREIGN KEY ("id_usuario_responsavel") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acao" ADD CONSTRAINT "acao_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acao" ADD CONSTRAINT "acao_id_usuario_alteracao_fkey" FOREIGN KEY ("id_usuario_alteracao") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
