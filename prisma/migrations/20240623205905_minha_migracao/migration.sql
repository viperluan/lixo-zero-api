-- CreateTable
CREATE TABLE "patrocionador" (
    "id" SERIAL NOT NULL,
    "celular" VARCHAR(11) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "descricao" TEXT NOT NULL,
    "cota" VARCHAR(2) NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,
    "situacao" VARCHAR(2) NOT NULL,
    "id_usuario_alteracao" INTEGER,
    "id_usuario_patrocinio" INTEGER NOT NULL,

    CONSTRAINT "patrocionador_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "patrocionador" ADD CONSTRAINT "patrocionador_id_usuario_alteracao_fkey" FOREIGN KEY ("id_usuario_alteracao") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrocionador" ADD CONSTRAINT "patrocionador_id_usuario_patrocinio_fkey" FOREIGN KEY ("id_usuario_patrocinio") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
