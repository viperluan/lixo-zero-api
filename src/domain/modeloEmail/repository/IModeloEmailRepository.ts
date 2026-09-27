import { CodigoModeloEmail, ConteudoModeloEmail, ModeloEmailRegistro } from '../modeloEmail';

export type SalvarModeloEmail = {
  codigo: CodigoModeloEmail;
  assunto: string;
  conteudo: ConteudoModeloEmail;
  id_usuario: string;
};

export default interface IModeloEmailRepository {
  listar(): Promise<ModeloEmailRegistro[]>;
  buscarPorCodigo(codigo: CodigoModeloEmail): Promise<ModeloEmailRegistro | null>;
  salvar(modelo: SalvarModeloEmail): Promise<ModeloEmailRegistro>;
}
