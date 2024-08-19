-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "tipo" VARCHAR(2) NOT NULL,
    "cpf_cnpj" VARCHAR(14) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);
