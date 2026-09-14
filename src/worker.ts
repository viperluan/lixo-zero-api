import { Worker } from 'bullmq';
import { criarConexaoRedis } from '@/infrastructure/fila/conexaoRedis';
import {
  NOME_FILA_EMAIL,
  obterOpcoesWorkerEmail,
} from '@/infrastructure/fila/configuracaoFilaEmail';
import { processarJobEmail } from '@/infrastructure/fila/processarJobEmail';

async function iniciar() {
  const conexao = criarConexaoRedis();
  const worker = new Worker(NOME_FILA_EMAIL, processarJobEmail, {
    connection: conexao,
    ...obterOpcoesWorkerEmail(),
  });

  worker.on('completed', (job) => {
    console.log(`E-mail enviado (job ${job.id}) para ${job.data.to}: ${job.data.subject}`);
  });

  worker.on('failed', (job, error) => {
    console.error(
      `Falha ao enviar e-mail (job ${job?.id}, tentativa ${job?.attemptsMade}) para ${job?.data.to}: ${error.message}`
    );
  });

  worker.on('error', (error) => {
    console.error('Erro no worker de e-mail:', error.message);
  });

  console.log('Worker de e-mail iniciado.');

  let encerrando = false;

  async function encerrar(sinal: string) {
    if (encerrando) return;
    encerrando = true;

    console.log(`${sinal} recebido, encerrando worker de e-mail...`);

    try {
      await worker.close();
      await conexao.quit();
    } catch (error) {
      console.error('Erro ao encerrar worker:', (error as Error).message);
    } finally {
      process.exit(0);
    }
  }

  process.on('SIGTERM', () => {
    void encerrar('SIGTERM');
  });
  process.on('SIGINT', () => {
    void encerrar('SIGINT');
  });
}

iniciar().catch((error) => {
  console.error('Não foi possível iniciar o worker de e-mail:', (error as Error).message);
  process.exit(1);
});
