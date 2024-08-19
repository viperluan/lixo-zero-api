-- DropForeignKey
ALTER TABLE "acao" DROP CONSTRAINT "acao_id_usuario_alteracao_fkey";

-- AddForeignKey
ALTER TABLE "acao" ADD CONSTRAINT "acao_id_usuario_alteracao_fkey" FOREIGN KEY ("id_usuario_alteracao") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
