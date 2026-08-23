/**
 * Retrato do usuário conforme o banco no momento da requisição.
 * Nunca deve ser montado a partir do payload do JWT: `tipo` e `status` mudam
 * sem invalidar tokens já emitidos.
 */
export type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  tipo: string;
};
