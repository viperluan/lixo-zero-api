import { SentMessageInfo, Transporter } from 'nodemailer';
import Email from '../../../domain/email/entity/Email';
import IEmailService from '../../../domain/email/service/IEmailService';

export type NodemailerServiceEntrada = {
  email: Email;
};

export type NodemailerServiceSaida = void;

export default class NodemailerService
  implements IEmailService<NodemailerServiceEntrada, NodemailerServiceSaida>
{
  constructor(private readonly transportador: Transporter<SentMessageInfo>) {}

  public async enviarEmail({
    email: { from, to, subject, html },
  }: NodemailerServiceEntrada): Promise<NodemailerServiceSaida> {
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
