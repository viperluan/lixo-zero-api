import { Prisma, PrismaClient } from '@prisma/client';
import {
  CodigoModeloEmail,
  codigoModeloEmail,
  ConteudoModeloEmail,
  ModeloEmailRegistro,
} from '@/domain/modeloEmail/modeloEmail';
import IModeloEmailRepository, {
  SalvarModeloEmail,
} from '@/domain/modeloEmail/repository/IModeloEmailRepository';

export default class ModeloEmailPrismaRepository implements IModeloEmailRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listar(): Promise<ModeloEmailRegistro[]> {
    const modelos = await this.prisma.modeloEmail.findMany({ orderBy: { codigo: 'asc' } });

    return modelos.flatMap((modelo) => {
      const registro = this.paraRegistro(modelo);
      return registro ? [registro] : [];
    });
  }

  async buscarPorCodigo(codigo: CodigoModeloEmail): Promise<ModeloEmailRegistro | null> {
    const modelo = await this.prisma.modeloEmail.findUnique({ where: { codigo } });
    if (!modelo) return null;

    return this.paraRegistro(modelo);
  }

  async salvar(modelo: SalvarModeloEmail): Promise<ModeloEmailRegistro> {
    const gravado = await this.prisma.modeloEmail.upsert({
      where: { codigo: modelo.codigo },
      create: {
        codigo: modelo.codigo,
        assunto: modelo.assunto,
        conteudo: modelo.conteudo as Prisma.InputJsonValue,
        id_usuario: modelo.id_usuario,
      },
      update: {
        assunto: modelo.assunto,
        conteudo: modelo.conteudo as Prisma.InputJsonValue,
        id_usuario: modelo.id_usuario,
      },
    });

    const registro = this.paraRegistro(gravado);
    if (!registro) throw new Error('Modelo de e-mail inválido.');

    return registro;
  }

  private paraRegistro(modelo: {
    codigo: string;
    assunto: string;
    conteudo: Prisma.JsonValue;
    atualizado_em: Date;
    id_usuario: string | null;
  }): ModeloEmailRegistro | null {
    const codigo = codigoModeloEmail(modelo.codigo);
    if (!codigo || !conteudoEhObjeto(modelo.conteudo)) return null;

    return {
      codigo,
      assunto: modelo.assunto,
      conteudo: modelo.conteudo as ConteudoModeloEmail,
      atualizado_em: modelo.atualizado_em,
      id_usuario: modelo.id_usuario,
    };
  }
}

function conteudoEhObjeto(conteudo: Prisma.JsonValue): conteudo is Prisma.JsonObject {
  return Boolean(conteudo) && typeof conteudo === 'object' && !Array.isArray(conteudo);
}
