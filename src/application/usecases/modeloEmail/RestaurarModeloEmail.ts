import { CodigoModeloEmail, ModeloEmailRegistro } from '@/domain/modeloEmail/modeloEmail';
import IModeloEmailRepository from '@/domain/modeloEmail/repository/IModeloEmailRepository';
import { Usecase } from '../usecase';
import { ASSUNTO_PADRAO_MODELO_EMAIL, conteudoPadrao } from './textosPadraoModeloEmail';

export type RestaurarModeloEmailEntradaDTO = {
  codigo: CodigoModeloEmail;
  id_usuario: string;
};

export default class RestaurarModeloEmail
  implements Usecase<RestaurarModeloEmailEntradaDTO, ModeloEmailRegistro>
{
  constructor(private readonly modeloEmailRepository: IModeloEmailRepository) {}

  async executar({
    codigo,
    id_usuario,
  }: RestaurarModeloEmailEntradaDTO): Promise<ModeloEmailRegistro> {
    return this.modeloEmailRepository.salvar({
      codigo,
      assunto: ASSUNTO_PADRAO_MODELO_EMAIL[codigo],
      conteudo: conteudoPadrao(codigo),
      id_usuario,
    });
  }
}
