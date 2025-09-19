import path from 'path';

export const resolveCaminhoArquivoTemplate = (nomeArquivo = '') => {
  const pasta = process.env.NODE_ENV === 'production' ? 'dist' : 'src';

  return path.join(process.cwd(), pasta, 'infrastructure', 'smtp', 'templates', nomeArquivo);
};
