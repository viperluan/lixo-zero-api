/*
  Warnings:

  - You are about to drop the column `receber_informacao_patrocionio` on the `Acao` table. All the data in the column will be lost.
  - Made the column `id_usuario_alteracao` on table `Acao` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Acao" DROP CONSTRAINT "Acao_id_usuario_alteracao_fkey";

-- AlterTable
ALTER TABLE "Acao" DROP COLUMN "receber_informacao_patrocionio",
ADD COLUMN     "receber_informacao_patrocinio" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id_usuario_alteracao" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Acao" ADD CONSTRAINT "Acao_id_usuario_alteracao_fkey" FOREIGN KEY ("id_usuario_alteracao") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
