import path from 'path';
import { Usecase } from '../usecase';
import IAcaoRepository from '../../../domain/acao/repository/IAcaoRepository';
import Acao from '../../../domain/acao/entity/Acao';
import { AcaoSituacao } from '../../../domain/acao/enum/AcaoSituacao';
import IUsuarioRepository from '../../../domain/usuario/repository/IUsuarioRepository';
import IEmailService from '../../../domain/email/service/IEmailService';
import GerarTemplateAcaoReprovada from '../email/GerarTemplateAcaoReprovada';
import GerarTemplateAcaoAprovada from '../email/GerarTemplateAcaoAprovada';
import Email from '../../../domain/email/entity/Email';

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
    const acao = await this.acaoRepository.buscarPorId(id);
    if (!acao) throw new Error('Ação não encontrada!');

    const usuario = await this.usuarioRepository.buscarPorId(acao.id_usuario_responsavel);
    if (!usuario) throw new Error('Usuário não encontrado!');

    const aprovacao = campos.situacao_acao === AcaoSituacao.Confirmada;
    const reprovacao = campos.situacao_acao === AcaoSituacao.Cancelada;

    const acaoAtualizada = await this.acaoRepository.atualizar(id, campos);

    let caminhoTemplate;
    let template;
    let subjectMessage;
    const dados = {
      nome_usuario: usuario.nome,
    };

    if (aprovacao) {
      caminhoTemplate = path.join(
        import.meta.dirname,
        '..',
        '..',
        '..',
        'infrastructure',
        'smtp',
        'templates',
        'NotificacaoAcaoAprovada.ejs'
      );

      const gerarTemplateAcaoAprovada = new GerarTemplateAcaoAprovada();
      template = await gerarTemplateAcaoAprovada.executar({ caminhoTemplate, dados });
      subjectMessage = 'aprovada';
    }

    if (reprovacao) {
      caminhoTemplate = path.join(
        import.meta.dirname,
        '..',
        '..',
        '..',
        'infrastructure',
        'smtp',
        'templates',
        'NotificacaoAcaoReprovada.ejs'
      );

      const gerarTemplateAcaoReprovada = new GerarTemplateAcaoReprovada();
      template = await gerarTemplateAcaoReprovada.executar({ caminhoTemplate, dados });
      subjectMessage = 'reprovada';
    }

    if (!template) throw new Error('Erro ao gerar template.');

    const email = Email.criarNovoEmail({
      from: 'caxiaslixozero@gmail.com',
      to: usuario.email,
      subject: `CaxiasLixoZero ${new Date().getFullYear()} - Informação de ação ${subjectMessage}!`,
      html: template,
    });

    await this.emailService.enviarEmail(email);

    return this.objetoDeSaida(acaoAtualizada);
  }

  private objetoDeSaida({
    id,
    nome_organizador,
    celular,
    titulo_acao,
    descricao_acao,
    data_acao,
    numero_organizadores_acao,
  }: Acao): AtualizarAcaoSaidaDTO {
    return {
      id,
      nome_organizador,
      celular,
      titulo_acao,
      descricao_acao,
      data_acao,
      numero_organizadores_acao,
    };
  }
}
