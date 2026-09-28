import { CodigoModeloEmail } from '@/domain/modeloEmail/modeloEmail';
import IModeloEmailRepository from '@/domain/modeloEmail/repository/IModeloEmailRepository';
import { Usecase } from '../usecase';
import { dadosExemploModeloEmail } from './dadosExemploModeloEmail';
import { renderizarModeloEmail, textosEfetivos } from './renderizarModeloEmail';

export type PreviaModeloEmail = {
  assunto: string;
  html: string;
};

export default class PreverModeloEmail implements Usecase<CodigoModeloEmail, PreviaModeloEmail> {
  constructor(private readonly modeloEmailRepository: IModeloEmailRepository) {}

  async executar(codigo: CodigoModeloEmail): Promise<PreviaModeloEmail> {
    const gravado = await this.modeloEmailRepository.buscarPorCodigo(codigo);

    return renderizarModeloEmail(
      codigo,
      textosEfetivos(codigo, gravado),
      dadosExemploModeloEmail(codigo)
    );
  }
}
