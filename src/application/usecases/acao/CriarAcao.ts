import { adicionaZeroAEsquerda } from '@/shared/utils/adicionaZeroAEsquerda';
import { Usecase } from '../usecase';
import Acao from '@/domain/acao/entity/Acao';
import Email from '@/domain/email/entity/Email';
import GerarTemplateAcaoCadastrada from '../email/GerarTemplateAcaoCadastrada';
import IAcaoRepository from '@/domain/acao/repository/IAcaoRepository';
import IUsuarioRepository from '@/domain/usuario/repository/IUsuarioRepository';
import IEdicaoRepository from '@/domain/edicao/repository/IEdicaoRepository';
import { ERRO_CADASTRO_FECHADO, ERRO_EDICAO_VIGENTE_AUSENTE } from '@/domain/edicao/erros';
import IEmailService from '@/domain/email/service/IEmailService';
import { diaCivilDaEntrada, diaCivilDeColunaDate } from '@/shared/utils/diaCivil';
import { resolveCaminhoArquivoTemplate } from '@/shared/utils/resolveCaminhoArquivoTemplate';

export type CriarAcaoDadosDTO = {
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
};

export type CriarAcaoEntradaDTO = CriarAcaoDadosDTO & {
  id_usuario_responsavel: string;
};

export type CriarAcaoSaidaDTO = {
  id: string;
};

export default class CriarAcao implements Usecase<CriarAcaoEntradaDTO, CriarAcaoSaidaDTO> {
  constructor(
    private readonly acaoRepository: IAcaoRepository,
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly edicaoRepository: IEdicaoRepository,
    private readonly emailService: IEmailService
  ) {}

  public async executar(entrada: CriarAcaoEntradaDTO): Promise<CriarAcaoSaidaDTO> {
    const edicao = await this.edicaoRepository.buscarVigente();
    if (!edicao) throw new Error(ERRO_EDICAO_VIGENTE_AUSENTE);

    const diaHoje = diaCivilDaEntrada(new Date().toISOString());
    if (!edicao.cadastroAberto(diaHoje)) throw new Error(ERRO_CADASTRO_FECHADO);

    const diaAcao = diaCivilDaEntrada(entrada.data_acao);
    if (!edicao.cobreRealizacao(diaAcao)) {
      throw new Error(
        `A data da ação precisa estar entre ${formatarDia(edicao.data_inicio_realizacao)} e ${formatarDia(edicao.data_fim_realizacao)}.`
      );
    }

    const tituloExiste = await this.acaoRepository.buscarPorTituloNaEdicao(
      entrada.titulo_acao,
      edicao.id
    );
    if (tituloExiste) throw new Error('Título já cadastrado.');

    const acao = Acao.criarNovaAcao({ ...entrada, id_edicao: edicao.id });
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

    const caminhoTemplate = resolveCaminhoArquivoTemplate('NotificacaoAcaoCriada.ejs');

    const gerarTemplateAcaoCadastrada = new GerarTemplateAcaoCadastrada();
    const template = await gerarTemplateAcaoCadastrada.executar({ caminhoTemplate, dados });

    if (!template) throw new Error('Erro ao gerar template.');

    const email = Email.criarNovoEmail({
      from: 'caxiaslixozero@gmail.com',
      to: usuario.email,
      subject: `CaxiasLixoZero ${edicao.ano} - Cadastro da ação: ${acao.titulo_acao}`,
      html: template,
    });

    await this.emailService.enviarEmail(email);

    return { id: acao.id };
  }
}

function formatarDia(data: Date): string {
  const [ano, mes, dia] = diaCivilDeColunaDate(data).split('-');
  return `${dia}/${mes}/${ano}`;
}
