/*
  Warnings:

  - You are about to drop the column `cota` on the `patrocionador` table. All the data in the column will be lost.
  - Added the required column `id_cota` to the `patrocionador` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "patrocionador" DROP COLUMN "cota",
ADD COLUMN     "id_cota" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "cota" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "cota_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "patrocionador" ADD CONSTRAINT "patrocionador_id_cota_fkey" FOREIGN KEY ("id_cota") REFERENCES "cota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
