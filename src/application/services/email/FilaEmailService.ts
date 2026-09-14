import Email from '@/domain/email/entity/Email';
import IEmailService from '@/domain/email/service/IEmailService';

export const NOME_JOB_ENVIAR_EMAIL = 'enviar-email';

export type PayloadJobEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export type EnfileirarEmail = {
  add(nome: string, dados: PayloadJobEmail): Promise<unknown>;
};

export default class FilaEmailService implements IEmailService {
  constructor(private readonly fila: EnfileirarEmail) {}

  public async enviarEmail(email: Email): Promise<void> {
    try {
      await this.fila.add(NOME_JOB_ENVIAR_EMAIL, {
        from: email.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
      });
    } catch (error) {
      console.error(
        `Falha ao enfileirar e-mail para ${email.to} (assunto: ${email.subject}): ${(error as Error).message}`
      );
    }
  }
}
