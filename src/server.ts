import app from './app';
import { fecharFilaEmail } from '@/infrastructure/fila/filaEmail';

const PORT = process.env.PORT || 3000;

const servidor = app.listen(PORT, () => {
  console.log(`API executando no endereço: http://localhost:${PORT}`);
});

let encerrando = false;

async function encerrar(sinal: string) {
  if (encerrando) return;
  encerrando = true;

  console.log(`${sinal} recebido, encerrando API...`);

  try {
    await new Promise<void>((resolve, reject) => {
      servidor.close((erro) => (erro ? reject(erro) : resolve()));
    });
    await fecharFilaEmail();
  } catch (error) {
    console.error('Erro ao encerrar a API:', (error as Error).message);
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
