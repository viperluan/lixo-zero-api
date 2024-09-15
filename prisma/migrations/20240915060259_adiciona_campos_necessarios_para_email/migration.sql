/*
  Warnings:

  - You are about to drop the column `link_organizador` on the `Acao` table. All the data in the column will be lost.
  - You are about to drop the column `local_acao` on the `Acao` table. All the data in the column will be lost.
  - You are about to drop the column `orientacao_divulgacao` on the `Acao` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_publico` on the `Acao` table. All the data in the column will be lost.
  - Added the required column `endereco_local_acao` to the `Acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `informacoes_acao` to the `Acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `link_divulgacao_acesso_acao` to the `Acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `link_para_inscricao_acao` to the `Acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome_local_acao` to the `Acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orientacao_divulgacao_acao` to the `Acao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_publico_acao` to the `Acao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Acao" DROP COLUMN "link_organizador",
DROP COLUMN "local_acao",
DROP COLUMN "orientacao_divulgacao",
DROP COLUMN "tipo_publico",
ADD COLUMN     "endereco_local_acao" TEXT NOT NULL,
ADD COLUMN     "informacoes_acao" TEXT NOT NULL,
ADD COLUMN     "link_divulgacao_acesso_acao" TEXT NOT NULL,
ADD COLUMN     "link_para_inscricao_acao" TEXT NOT NULL,
ADD COLUMN     "nome_local_acao" TEXT NOT NULL,
ADD COLUMN     "orientacao_divulgacao_acao" TEXT NOT NULL,
ADD COLUMN     "tipo_publico_acao" VARCHAR(2) NOT NULL;
