import path from 'path';
import Acao from '../../../domain/acao/entity/Acao';
import IAcaoRepository from '../../../domain/acao/repository/IAcaoRepository';
import Email from '../../../domain/email/entity/Email';
import IUsuarioRepository from '../../../domain/usuario/repository/IUsuarioRepository';
import { Usecase } from '../usecase';
import GerarTemplateAcaoCadastrada from '../email/GerarTemplateAcaoCadastrada';
import NodemailerService from '../../services/email/NodemailerService';
import { transportador } from '../../../shared/package/nodemailer';
import { adicionaZeroAEsquerda } from '../../../shared/utils/adicionaZeroAEsquerda';

export type CriarAcaoEntradaDTO = {
  id: string;
  nome_organizador: string;
  celular: string;
  titulo_acao: string;
  descricao_acao: string;
  id_categoria: string;
  data_acao: string;
  forma_realizacao_acao: string;
  link_divulgacao_acesso_acao: string;
  nome_local_acao: string;
  endereco_local_acao: string;
  informacoes_acao: string;
  link_para_inscricao_acao: string;
  tipo_publico_acao: string;
  orientacao_divulgacao_acao: string;
  numero_organizadores_acao: number;
  id_usuario_responsavel: string;
  id_usuario_alteracao: string;
};

export type CriarAcaoSaidaDTO = {
  id: string;
};

export default class CriarAcao implements Usecase<CriarAcaoEntradaDTO, CriarAcaoSaidaDTO> {
  constructor(
    private readonly acaoRepository: IAcaoRepository,
    private readonly usuarioRepository: IUsuarioRepository
  ) {}

  public async executar(entrada: CriarAcaoEntradaDTO): Promise<CriarAcaoSaidaDTO> {
    const tituloExiste = await this.acaoRepository.buscarPorTitulo(entrada.titulo_acao);
    if (tituloExiste) throw new Error('Título já cadastrado.');

    const acao = Acao.criarNovaAcao(entrada);
    await this.acaoRepository.salvar(acao);

    const usuario = await this.usuarioRepository.buscarPorId(acao.id_usuario_responsavel);
    if (!usuario) throw new Error('Usuario não encontrado.');

    const dia = adicionaZeroAEsquerda(acao.data_acao.getDate());
    const mes = adicionaZeroAEsquerda(acao.data_acao.getMonth() + 1);
    const ano = acao.data_acao.getFullYear();

    const hora = adicionaZeroAEsquerda(acao.data_acao.getHours());
    const minutos = adicionaZeroAEsquerda(acao.data_acao.getMinutes());

    const data_acao = `${dia}/${mes}/${ano}`;
    const horario_acao = `${hora}:${minutos}`;

    const dados = {
      nome_usuario: usuario.nome,
      nome_organizador: acao.nome_organizador,
      titulo_acao: acao.titulo_acao,
      data_acao,
      horario_acao,
      forma_realizacao_acao: acao.forma_realizacao_acao_texto,
      tipo_publico_acao: acao.tipo_publico_acao_texto,
      link_para_inscricao_acao: acao.link_para_inscricao_acao,
      link_divulgacao_acesso_acao: acao.link_divulgacao_acesso_acao,
      nome_local_acao: acao.nome_local_acao,
      endereco_local_acao: acao.endereco_local_acao,
      informacoes_acao: acao.informacoes_acao,
    };

    const caminhoTemplate = path.join(
      import.meta.dirname,
      '..',
      '..',
      '..',
      'infrastructure',
      'smtp',
      'templates',
      'NotificacaoAcaoCriada.ejs'
    );

    const gerarTemplateAcaoCadastrada = new GerarTemplateAcaoCadastrada();
    const template = await gerarTemplateAcaoCadastrada.executar({ caminhoTemplate, dados });
    if (!template) throw new Error('Erro ao gerar template.');

    const email = Email.criarNovoEmail({
      from: 'caxiaslixozero@gmail.com',
      to: usuario.email,
      subject: `CaxiasLixoZero ${new Date().getFullYear()} - Cadastro da ação: ${acao.titulo_acao}`,
      html: template,
    });

    const nodemailerService = new NodemailerService(transportador);
    await nodemailerService.enviarEmail({ email });

    return { id: acao.id };
  }
}
