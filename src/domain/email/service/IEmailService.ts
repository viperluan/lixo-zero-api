export default interface IEmailService<EmailEntradaDto, EmailSaidaDto> {
  enviarEmail(entrada: EmailEntradaDto): Promise<EmailSaidaDto>;
}
