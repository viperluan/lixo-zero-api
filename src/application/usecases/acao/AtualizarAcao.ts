import { Usecase } from '../usecase';
import IAcaoRepository from '../../../domain/acao/repository/IAcaoRepository';
import Acao from '../../../domain/acao/entity/Acao';
import { AcaoSituacao } from '../../../domain/acao/enum/AcaoSituacao';
import IUsuarioRepository from '../../../domain/usuario/repository/IUsuarioRepository';
import IEmailService from '../../../domain/email/service/IEmailService';
import GerarTemplateAcaoReprovada from '../email/GerarTemplateAcaoReprovada';
import GerarTemplateAcaoAprovada from '../email/GerarTemplateAcaoAprovada';
import Email from '../../../domain/email/entity/Email';
import { resolveCaminhoArquivoTemplate } from 'src/shared/utils/resolveCaminhoArquivoTemplate';

export type AtualizarAcaoEntradaDTO = {
  id: string;
  campos: Pick<Acao, 'situacao_acao' | 'id_usuario_alteracao'>;
};

export type AtualizarAcaoSaidaDTO = {
  id: string;
  nome_organizador: string;
  celular: string;
  titulo_acao: string;
  descricao_acao: string;
  data_acao: Date;
  numero_organizadores_acao: number;
  situacao_acao: string;
};

export default class AtualizarAcao
  implements Usecase<AtualizarAcaoEntradaDTO, AtualizarAcaoSaidaDTO>
{
  constructor(
    private readonly acaoRepository: IAcaoRepository,
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly emailService: IEmailService
  ) {}

  async executar({ id, campos }: AtualizarAcaoEntradaDTO): Promise<AtualizarAcaoSaidaDTO> {
    const aprovacao = this.validarSituacao(campos.situacao_acao);

    const acao = await this.acaoRepository.buscarPorId(id);
    if (!acao) throw new Error('Ação não encontrada!');

    const usuario = await this.usuarioRepository.buscarPorId(acao.id_usuario_responsavel);
    if (!usuario) throw new Error('Usuário não encontrado!');

    const template = await this.gerarTemplate(aprovacao, usuario.nome);

    const acaoAtualizada = await this.acaoRepository.atualizar(id, campos);

    const situacaoTexto = aprovacao ? 'aprovada' : 'reprovada';
    const email = Email.criarNovoEmail({
      from: 'caxiaslixozero@gmail.com',
      to: usuario.email,
      subject: `CaxiasLixoZero ${new Date().getFullYear()} - Informação de ação ${situacaoTexto}!`,
      html: template,
    });

    await this.emailService.enviarEmail(email);

    return this.objetoDeSaida(acaoAtualizada);
  }

  /** Retorna `true` para aprovação e `false` para reprovação. */
  private validarSituacao(situacao: string): boolean {
    if (situacao === AcaoSituacao.Aprovada) return true;
    if (situacao === AcaoSituacao.Reprovada) return false;

    throw new Error(
      `Situação inválida. Use "${AcaoSituacao.Aprovada}" para aprovar ou "${AcaoSituacao.Reprovada}" para reprovar.`
    );
  }

  private async gerarTemplate(aprovacao: boolean, nomeUsuario: string): Promise<string> {
    const dados = { nome_usuario: nomeUsuario };
    const caminhoTemplate = resolveCaminhoArquivoTemplate(
      aprovacao ? 'NotificacaoAcaoAprovada.ejs' : 'NotificacaoAcaoReprovada.ejs'
    );

    const template = aprovacao
      ? await new GerarTemplateAcaoAprovada().executar({ caminhoTemplate, dados })
      : await new GerarTemplateAcaoReprovada().executar({ caminhoTemplate, dados });

    if (!template) throw new Error('Erro ao gerar template.');

    return template;
  }

  private objetoDeSaida({
    id,
    nome_organizador,
    celular,
    titulo_acao,
    descricao_acao,
    data_acao,
    numero_organizadores_acao,
    situacao_acao_texto,
  }: Acao): AtualizarAcaoSaidaDTO {
    return {
      id,
      nome_organizador,
      celular,
      titulo_acao,
      descricao_acao,
      data_acao,
      numero_organizadores_acao,
      situacao_acao: situacao_acao_texto,
    };
  }
}
