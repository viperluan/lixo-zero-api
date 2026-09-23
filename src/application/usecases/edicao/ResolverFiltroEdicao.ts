import { ERRO_EDICAO_NAO_ENCONTRADA } from '@/domain/edicao/erros';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { Usecase } from '../usecase';

export type PerfilFiltroEdicao = 'publico' | 'admin' | 'minhas';

export type ResolverFiltroEdicaoEntradaDTO = {
  perfil: PerfilFiltroEdicao;
  ano?: string;
  id_edicao?: string;
};

export type ResolverFiltroEdicaoSaidaDTO = {
  id_edicao?: string;
  sem_resultado: boolean;
};

export default class ResolverFiltroEdicao
  implements Usecase<ResolverFiltroEdicaoEntradaDTO, ResolverFiltroEdicaoSaidaDTO>
{
  constructor(private readonly edicaoRepository: IEdicaoRepository) {}

  async executar({
    perfil,
    ano,
    id_edicao,
  }: ResolverFiltroEdicaoEntradaDTO): Promise<ResolverFiltroEdicaoSaidaDTO> {
    if (perfil === 'publico') return this.vigenteOuVazio();

    if (perfil === 'minhas') return this.filtroOpcional(ano, id_edicao);

    if (ano === 'todos') return { sem_resultado: false };

    if (id_edicao) return this.porId(id_edicao);
    if (ano) return this.porAno(ano);

    return this.vigenteOuVazio();
  }

  private async vigenteOuVazio(): Promise<ResolverFiltroEdicaoSaidaDTO> {
    const vigente = await this.edicaoRepository.buscarVigente();
    if (!vigente) return { sem_resultado: true };

    return { id_edicao: vigente.id, sem_resultado: false };
  }

  private async filtroOpcional(
    ano?: string,
    idEdicao?: string
  ): Promise<ResolverFiltroEdicaoSaidaDTO> {
    if (idEdicao) return this.porId(idEdicao);
    if (ano && ano !== 'todos') return this.porAno(ano);

    return { sem_resultado: false };
  }

  private async porId(idEdicao: string): Promise<ResolverFiltroEdicaoSaidaDTO> {
    const edicao = await this.edicaoRepository.buscarPorId(idEdicao);
    if (!edicao) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    return { id_edicao: edicao.id, sem_resultado: false };
  }

  private async porAno(ano: string): Promise<ResolverFiltroEdicaoSaidaDTO> {
    if (!/^\d{4}$/.test(ano)) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    const edicao = await this.edicaoRepository.buscarPorAno(Number(ano));
    if (!edicao) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    return { id_edicao: edicao.id, sem_resultado: false };
  }
}
