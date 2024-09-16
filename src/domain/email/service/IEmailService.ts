import Email from '../entity/Email';

export default interface IEmailService {
  enviarEmail(entrada: Email): Promise<void>;
}
