-- DropForeignKey
ALTER TABLE "Patrocinador" DROP CONSTRAINT "Patrocinador_id_usuario_alteracao_fkey";

-- DropForeignKey
ALTER TABLE "Patrocinador" DROP CONSTRAINT "Patrocinador_id_usuario_patrocinio_fkey";

-- DropForeignKey
ALTER TABLE "Patrocinador" DROP CONSTRAINT "Patrocinador_id_cota_fkey";

-- DropTable
DROP TABLE "Patrocinador";

-- DropTable
DROP TABLE "Cota";

-- AlterTable
ALTER TABLE "Acao" DROP COLUMN "receber_informacao_patrocinio";
