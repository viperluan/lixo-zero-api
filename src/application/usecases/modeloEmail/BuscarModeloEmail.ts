import {
  CodigoModeloEmail,
  ERRO_MODELO_EMAIL_NAO_ENCONTRADO,
  ModeloEmailRegistro,
} from '@/domain/modeloEmail/modeloEmail';
import IModeloEmailRepository from '@/domain/modeloEmail/repository/IModeloEmailRepository';
import { Usecase } from '../usecase';
import { textosEfetivos } from './renderizarModeloEmail';

export default class BuscarModeloEmail implements Usecase<CodigoModeloEmail, ModeloEmailRegistro> {
  constructor(private readonly modeloEmailRepository: IModeloEmailRepository) {}

  async executar(codigo: CodigoModeloEmail): Promise<ModeloEmailRegistro> {
    const gravado = await this.modeloEmailRepository.buscarPorCodigo(codigo);
    if (gravado) return gravado;

    const textos = textosEfetivos(codigo, null);
    if (!textos.assunto) throw new Error(ERRO_MODELO_EMAIL_NAO_ENCONTRADO);

    return {
      codigo,
      assunto: textos.assunto,
      conteudo: textos.conteudo,
      atualizado_em: null,
      id_usuario: null,
    };
  }
}
