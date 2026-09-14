import { Queue } from 'bullmq';
import { criarConexaoRedis } from './conexaoRedis';
import { NOME_FILA_EMAIL, obterOpcoesPadraoJobEmail } from './configuracaoFilaEmail';
import type { PayloadJobEmail } from '@/application/services/email/FilaEmailService';

const conexaoRedisFila = criarConexaoRedis({ falharRapido: true });

export const filaEmail = new Queue<PayloadJobEmail>(NOME_FILA_EMAIL, {
  connection: conexaoRedisFila,
  defaultJobOptions: obterOpcoesPadraoJobEmail(),
});

export async function fecharFilaEmail(): Promise<void> {
  await filaEmail.close();
  await conexaoRedisFila.quit();
}
