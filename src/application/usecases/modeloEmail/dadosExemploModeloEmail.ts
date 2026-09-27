import { CodigoModeloEmail } from '@/domain/modeloEmail/modeloEmail';

const COMUNS = {
  ano: '2026',
  nome_usuario: 'Maria Silva',
};

const ACAO = {
  nome_organizador: 'Instituto Verde',
  titulo_acao: 'Mutirão de limpeza do Arroio Tega',
  data_acao: '07/11/2026',
  horario_acao: '09:00',
  forma_realizacao_acao: 'Presencial',
  tipo_publico_acao: 'Externo',
  link_divulgacao_acesso_acao: 'https://exemplo.org/acesso',
  nome_local_acao: 'Parque dos Macaquinhos',
  endereco_local_acao: 'Rua Os Dezoito do Forte, s/n',
  informacoes_acao: 'Levar luvas.',
  link_para_inscricao_acao: 'https://exemplo.org/inscricao',
};

export function dadosExemploModeloEmail(codigo: CodigoModeloEmail): Record<string, string> {
  if (codigo === 'acao_cadastrada') return { ...COMUNS, ...ACAO };

  return COMUNS;
}
