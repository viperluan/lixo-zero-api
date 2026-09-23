import Email from '@/domain/email/entity/Email';
import IEmailService from '@/domain/email/service/IEmailService';
import IRedefinicaoSenhaRepository from '@/domain/usuario/repository/IRedefinicaoSenhaRepository';
import IUsuarioRepository from '@/domain/usuario/repository/IUsuarioRepository';
import {
  gerarTokenRedefinicaoSenha,
  hashTokenRedefinicaoSenha,
} from '@/domain/usuario/tokenRedefinicaoSenha';
import { resolveCaminhoArquivoTemplate } from '@/shared/utils/resolveCaminhoArquivoTemplate';
import GerarTemplateRedefinicaoSenha from '../email/GerarTemplateRedefinicaoSenha';
import { Usecase } from '../usecase';

export const MENSAGEM_SOLICITACAO_REDEFINICAO_SENHA =
  'Se existir uma conta com esse e-mail, enviaremos instruções para redefinir a senha.';

const REMETENTE = 'caxiaslixozero@gmail.com';
const VALIDADE_TOKEN_MS = 60 * 60 * 1000;
const INTERVALO_MINIMO_ENTRE_EMAILS_MS = 2 * 60 * 1000;

export type SolicitarRedefinicaoSenhaEntradaDTO = {
  email: unknown;
};

export type SolicitarRedefinicaoSenhaSaidaDTO = void;

export default class SolicitarRedefinicaoSenha
  implements Usecase<SolicitarRedefinicaoSenhaEntradaDTO, SolicitarRedefinicaoSenhaSaidaDTO>
{
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly redefinicaoSenhaRepository: IRedefinicaoSenhaRepository,
    private readonly emailService: IEmailService
  ) {}

  async executar({ email }: SolicitarRedefinicaoSenhaEntradaDTO): Promise<void> {
    if (typeof email !== 'string' || email.length === 0) return;

    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario || !usuario.status) return;

    const ultima = await this.redefinicaoSenhaRepository.buscarMaisRecentePorUsuario(usuario.id);
    if (ultima && Date.now() - ultima.criado_em.getTime() < INTERVALO_MINIMO_ENTRE_EMAILS_MS) {
      return;
    }

    const token = gerarTokenRedefinicaoSenha();
    const link = montarLinkRedefinicao(token);
    if (!link) {
      console.error(
        'URL_FRONT ausente ou inválida; e-mail de redefinição de senha não enfileirado.'
      );
      return;
    }

    const caminhoTemplate = resolveCaminhoArquivoTemplate('RedefinicaoSenha.ejs');
    const html = await new GerarTemplateRedefinicaoSenha().executar({
      caminhoTemplate,
      dados: { nome_usuario: usuario.nome, link_redefinicao: link },
    });

    if (!html) {
      console.error(`Falha ao renderizar o e-mail de redefinição de senha para ${usuario.email}.`);
      return;
    }

    await this.redefinicaoSenhaRepository.substituirToken(
      usuario.id,
      hashTokenRedefinicaoSenha(token),
      new Date(Date.now() + VALIDADE_TOKEN_MS)
    );

    const mensagem = Email.criarNovoEmail({
      from: REMETENTE,
      to: usuario.email,
      subject: `CaxiasLixoZero ${new Date().getFullYear()} - Redefinição de senha`,
      html,
    });

    await this.emailService.enviarEmail(mensagem);
  }
}

function montarLinkRedefinicao(token: string): string | null {
  const base = process.env.URL_FRONT?.trim().replace(/\/+$/, '');
  if (!base || !/^https?:\/\/\S+$/.test(base)) return null;

  return `${base}/redefinir-senha?token=${encodeURIComponent(token)}`;
}
