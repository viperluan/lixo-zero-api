/*
  Warnings:

  - Added the required column `orientacao_divulgacao` to the `Acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_publico` to the `Acao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Acao" ADD COLUMN     "orientacao_divulgacao" TEXT NOT NULL,
ADD COLUMN     "tipo_publico" VARCHAR(2) NOT NULL;
