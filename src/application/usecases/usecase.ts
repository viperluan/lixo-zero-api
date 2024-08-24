export interface Usecase<EntradaDto, SaidaDto> {
  executar(entrada: EntradaDto): Promise<SaidaDto>;
}
