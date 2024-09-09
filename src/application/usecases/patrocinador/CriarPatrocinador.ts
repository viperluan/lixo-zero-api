import Patrocinador from '../../../domain/patrocinador/entity/Patrocinador';
import IPatrocinadorRepository from '../../../domain/patrocinador/repository/IPatrocinadorRepository';
import { Usecase } from '../usecase';

export type CriarPatrocinadorEntradaDTO = {
  nome: string;
  celular: string;
  descricao: string;
  situacao: string;
  id_cota: string;
  id_usuario: string;
};

export type CriarPatrocinadorSaidaDTO = void;

export default class CriarPatrocinador
  implements Usecase<CriarPatrocinadorEntradaDTO, CriarPatrocinadorSaidaDTO>
{
  constructor(private readonly patrocinadorRepository: IPatrocinadorRepository) {}

  public async executar({
    nome,
    celular,
    descricao,
    situacao,
    id_cota,
    id_usuario,
  }: CriarPatrocinadorEntradaDTO): Promise<CriarPatrocinadorSaidaDTO> {
    const nomeExiste = await this.patrocinadorRepository.buscarPorNome(nome);
    if (nomeExiste) throw new Error('Nome de patrocinador já cadastrado.');

    const novoPatrocinador = Patrocinador.criarNovoPatrocinador({
      nome,
      celular,
      descricao,
      situacao,
      id_cota,
      id_usuario_patrocinio: id_usuario,
      id_usuario_alteracao: id_usuario,
    });

    await this.patrocinadorRepository.salvar(novoPatrocinador);
  }
}
