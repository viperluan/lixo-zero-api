import Cota from '../../../domain/cota/entity/Cota';
import ICotaRepository from '../../../domain/cota/repository/ICotaRepository';
import { Usecase } from '../usecase';

export type CriarCotaEntradaDTO = {
  descricao: string;
};

export type CriarCotaSaidaDTO = {
  id: string;
  descricao: string;
};

export default class CriarCota implements Usecase<CriarCotaEntradaDTO, CriarCotaSaidaDTO> {
  constructor(private readonly cotaRepository: ICotaRepository) {}

  public async executar({ descricao }: CriarCotaEntradaDTO): Promise<CriarCotaSaidaDTO> {
    const cotaExiste = await this.cotaRepository.buscarPorDescricao(descricao);
    if (cotaExiste) throw new Error('Descrição já existe.');

    const cota = Cota.criarNovaCota({ descricao });
    await this.cotaRepository.salvar(cota);

    return this.objetoDeSaida(cota);
  }

  private objetoDeSaida({ id, descricao }: Cota): CriarCotaSaidaDTO {
    return {
      id,
      descricao,
    };
  }
}
