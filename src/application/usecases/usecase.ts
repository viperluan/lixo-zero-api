export interface Usecase<EntradaDto, SaidaDto> {
  execute(entrada: EntradaDto): Promise<SaidaDto>;
}
