import { CODIGOS_MODELO_EMAIL, ModeloEmailRegistro } from '@/domain/modeloEmail/modeloEmail';
import IModeloEmailRepository from '@/domain/modeloEmail/repository/IModeloEmailRepository';
import { Usecase } from '../usecase';
import { ASSUNTO_PADRAO_MODELO_EMAIL, conteudoPadrao } from './textosPadraoModeloEmail';

export default class ListarModelosEmail
  implements Usecase<Record<string, never>, ModeloEmailRegistro[]>
{
  constructor(private readonly modeloEmailRepository: IModeloEmailRepository) {}

  async executar(): Promise<ModeloEmailRegistro[]> {
    const gravados = await this.modeloEmailRepository.listar();

    return CODIGOS_MODELO_EMAIL.map((codigo) => {
      const gravado = gravados.find((modelo) => modelo.codigo === codigo);
      if (gravado) return gravado;

      return {
        codigo,
        assunto: ASSUNTO_PADRAO_MODELO_EMAIL[codigo],
        conteudo: conteudoPadrao(codigo),
        atualizado_em: null,
        id_usuario: null,
      };
    });
  }
}
