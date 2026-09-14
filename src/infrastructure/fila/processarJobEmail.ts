import { Job } from 'bullmq';
import Email from '@/domain/email/entity/Email';
import NodemailerService from '@/application/services/email/NodemailerService';
import type { PayloadJobEmail } from '@/application/services/email/FilaEmailService';
import { transportador } from '@/shared/package/nodemailer';

const nodemailerService = new NodemailerService(transportador);

export async function processarJobEmail(job: Job<PayloadJobEmail>): Promise<void> {
  const { from, to, subject, html } = job.data;

  console.log(`Processando e-mail (job ${job.id}) para ${to}: ${subject}`);

  const email = Email.criarNovoEmail({ from, to, subject, html });
  await nodemailerService.enviarEmail(email);
}
