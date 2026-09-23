-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "senha_alterada_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RedefinicaoSenha" (
    "id" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedefinicaoSenha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RedefinicaoSenha_token_hash_key" ON "RedefinicaoSenha"("token_hash");

-- CreateIndex
CREATE INDEX "RedefinicaoSenha_id_usuario_criado_em_idx" ON "RedefinicaoSenha"("id_usuario", "criado_em");

-- AddForeignKey
ALTER TABLE "RedefinicaoSenha" ADD CONSTRAINT "RedefinicaoSenha_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
