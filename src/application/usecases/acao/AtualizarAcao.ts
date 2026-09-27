import { Usecase } from '../usecase';
import IAcaoRepository from '@/domain/acao/repository/IAcaoRepository';
import Acao from '@/domain/acao/entity/Acao';
import { AcaoSituacao } from '@/domain/acao/enum/AcaoSituacao';
import IUsuarioRepository from '@/domain/usuario/repository/IUsuarioRepository';
import IEmailService from '@/domain/email/service/IEmailService';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { ERRO_EDICAO_NAO_ENCONTRADA } from '@/domain/edicao/erros';
import Email from '@/domain/email/entity/Email';
import IModeloEmailRepository from '@/domain/modeloEmail/repository/IModeloEmailRepository';
import { renderizarModeloEmail, textosEfetivos } from '../modeloEmail/renderizarModeloEmail';

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
    private readonly edicaoRepository: IEdicaoRepository,
    private readonly emailService: IEmailService,
    private readonly modeloEmailRepository: IModeloEmailRepository
  ) {}

  async executar({ id, campos }: AtualizarAcaoEntradaDTO): Promise<AtualizarAcaoSaidaDTO> {
    const aprovacao = this.validarSituacao(campos.situacao_acao);

    const acao = await this.acaoRepository.buscarPorId(id);
    if (!acao) throw new Error('Ação não encontrada!');

    const usuario = await this.usuarioRepository.buscarPorId(acao.id_usuario_responsavel);
    if (!usuario) throw new Error('Usuário não encontrado!');

    const edicao = await this.edicaoRepository.buscarPorId(acao.id_edicao);
    if (!edicao) throw new Error(ERRO_EDICAO_NAO_ENCONTRADA);

    const codigo = aprovacao ? 'acao_aprovada' : 'acao_reprovada';
    const gravado = await this.modeloEmailRepository.buscarPorCodigo(codigo);
    const emailMontado = await renderizarModeloEmail(codigo, textosEfetivos(codigo, gravado), {
      nome_usuario: usuario.nome,
      ano: String(edicao.ano),
    });

    const acaoAtualizada = await this.acaoRepository.atualizar(id, campos);

    const email = Email.criarNovoEmail({
      from: 'caxiaslixozero@gmail.com',
      to: usuario.email,
      subject: emailMontado.assunto,
      html: emailMontado.html,
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
