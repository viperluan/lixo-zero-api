import Email from '@/domain/email/entity/Email';
import IEmailService from '@/domain/email/service/IEmailService';
import Usuario from '@/domain/usuario/entity/Usuario';
import IRedefinicaoSenhaRepository from '@/domain/usuario/repository/IRedefinicaoSenhaRepository';
import IUsuarioRepository from '@/domain/usuario/repository/IUsuarioRepository';
import { hashTokenRedefinicaoSenha } from '@/domain/usuario/tokenRedefinicaoSenha';
import { resolveCaminhoArquivoTemplate } from '@/shared/utils/resolveCaminhoArquivoTemplate';
import GerarTemplateSenhaAlterada from '../email/GerarTemplateSenhaAlterada';
import { Usecase } from '../usecase';

export const ERRO_LINK_REDEFINICAO_SENHA = 'Link inválido ou expirado.';
export const ERRO_TAMANHO_SENHA_REDEFINICAO = 'A senha deve ter entre 10 e 128 caracteres.';
export const MENSAGEM_SENHA_REDEFINIDA = 'Senha redefinida. Entre novamente com a nova senha.';

const REMETENTE = 'caxiaslixozero@gmail.com';
const TAMANHO_MINIMO_SENHA = 10;
const TAMANHO_MAXIMO_SENHA = 128;

export type RedefinirSenhaEntradaDTO = {
  token: unknown;
  senha: unknown;
};

export type RedefinirSenhaSaidaDTO = void;

export default class RedefinirSenha
  implements Usecase<RedefinirSenhaEntradaDTO, RedefinirSenhaSaidaDTO>
{
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly redefinicaoSenhaRepository: IRedefinicaoSenhaRepository,
    private readonly emailService: IEmailService
  ) {}

  async executar({ token, senha }: RedefinirSenhaEntradaDTO): Promise<void> {
    if (typeof token !== 'string' || token.length === 0) {
      throw new Error(ERRO_LINK_REDEFINICAO_SENHA);
    }

    const registro = await this.redefinicaoSenhaRepository.buscarPorTokenHash(
      hashTokenRedefinicaoSenha(token)
    );

    if (!registro || registro.usado_em || registro.expira_em.getTime() <= Date.now()) {
      throw new Error(ERRO_LINK_REDEFINICAO_SENHA);
    }

    const usuario = await this.usuarioRepository.buscarPorId(registro.id_usuario);
    if (!usuario || !usuario.status) throw new Error(ERRO_LINK_REDEFINICAO_SENHA);

    if (!senhaTemTamanhoValido(senha)) throw new Error(ERRO_TAMANHO_SENHA_REDEFINICAO);

    const usuarioAtualizado = Usuario.redefinirSenha(usuario, senha);
    const senhaAlteradaEm = usuarioAtualizado.senha_alterada_em ?? new Date();

    const consumiu = await this.redefinicaoSenhaRepository.consumir(
      registro.id,
      usuario.id,
      usuarioAtualizado.senha,
      senhaAlteradaEm
    );
    if (!consumiu) throw new Error(ERRO_LINK_REDEFINICAO_SENHA);

    await this.enviarAvisoDeSenhaAlterada(usuario.nome, usuario.email);
  }

  private async enviarAvisoDeSenhaAlterada(nome: string, email: string): Promise<void> {
    const caminhoTemplate = resolveCaminhoArquivoTemplate('SenhaAlterada.ejs');
    const html = await new GerarTemplateSenhaAlterada().executar({
      caminhoTemplate,
      dados: { nome_usuario: nome },
    });

    if (!html) {
      console.error(`Falha ao renderizar o aviso de senha alterada para ${email}.`);
      return;
    }

    await this.emailService.enviarEmail(
      Email.criarNovoEmail({
        from: REMETENTE,
        to: email,
        subject: `CaxiasLixoZero ${new Date().getFullYear()} - Sua senha foi alterada`,
        html,
      })
    );
  }
}

function senhaTemTamanhoValido(senha: unknown): senha is string {
  return (
    typeof senha === 'string' &&
    senha.length >= TAMANHO_MINIMO_SENHA &&
    senha.length <= TAMANHO_MAXIMO_SENHA
  );
}
