import { PrismaClient } from '@prisma/client';
import Cota from '../../domain/cota/entity/Cota';
import ICotaRepository from '../../domain/cota/repository/ICotaRepository';

export default class CotaPrismaRepository implements ICotaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async buscarPorId(id: string): Promise<Cota | null> {
    const cota = await this.prisma.cota.findFirst({ where: { id } });

    if (!cota) return null;

    return Cota.carregarCotaExistente(cota);
  }

  public async buscarPorDescricao(descricao: string): Promise<Cota | null> {
    const cota = await this.prisma.cota.findFirst({ where: { descricao } });

    if (!cota) return null;

    return Cota.carregarCotaExistente(cota);
  }

  public async buscarComPaginacao(pagina: number, limiteCotas: number): Promise<Cota[] | null> {
    const listaDeCotas = await this.prisma.cota.findMany({
      skip: (pagina - 1) * limiteCotas,
      take: limiteCotas,
    });

    const cotas = listaDeCotas.map((cota) => Cota.carregarCotaExistente(cota));

    return cotas;
  }

  public async buscarQuantidadeCotas(): Promise<number> {
    const quantidadeCotas = await this.prisma.cota.count();

    return quantidadeCotas;
  }

  public async salvar({ id, descricao }: Cota): Promise<void> {
    const data = {
      id,
      descricao,
    };

    await this.prisma.cota.create({ data });
  }

  public async atualizar({ id, descricao }: Cota): Promise<void> {
    const data = {
      descricao,
    };

    await this.prisma.cota.update({ where: { id }, data });
  }

  public async deletar(id: string): Promise<void> {
    await this.prisma.cota.delete({ where: { id } });
  }
}
