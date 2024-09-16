import { SentMessageInfo, Transporter } from 'nodemailer';
import Email from '../../../domain/email/entity/Email';
import IEmailService from '../../../domain/email/service/IEmailService';

export default class NodemailerService implements IEmailService {
  constructor(private readonly transportador: Transporter<SentMessageInfo>) {}

  public async enviarEmail({ from, html, subject, to }: Email): Promise<void> {
    try {
      await this.transportador.sendMail({
        from,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.log((error as Error).message);
    }
  }
}
