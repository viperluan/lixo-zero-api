import { CodigoModeloEmail, ModeloEmailRegistro } from '@/domain/modeloEmail/modeloEmail';
import IModeloEmailRepository from '@/domain/modeloEmail/repository/IModeloEmailRepository';
import { Usecase } from '../usecase';
import { validarModeloEmail } from './validarModeloEmail';

export type SalvarModeloEmailEntradaDTO = {
  codigo: CodigoModeloEmail;
  assunto: unknown;
  conteudo: unknown;
  id_usuario: string;
};

export default class SalvarModeloEmail
  implements Usecase<SalvarModeloEmailEntradaDTO, ModeloEmailRegistro>
{
  constructor(private readonly modeloEmailRepository: IModeloEmailRepository) {}

  async executar({
    codigo,
    assunto,
    conteudo,
    id_usuario,
  }: SalvarModeloEmailEntradaDTO): Promise<ModeloEmailRegistro> {
    const validado = validarModeloEmail(codigo, assunto, conteudo);

    return this.modeloEmailRepository.salvar({
      codigo,
      assunto: validado.assunto,
      conteudo: validado.conteudo,
      id_usuario,
    });
  }
}
