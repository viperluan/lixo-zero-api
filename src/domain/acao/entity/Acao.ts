import { v4 as gerarUuid } from 'uuid';
import { AcaoSituacao } from '../enum/AcaoSituacao';
import { AcaoFormaRealizacao } from '../enum/AcaoFormaRealizacao';
import { AcaoTipoPublico } from '../enum/AcaoTipoPublico';

export type CategoriaAcao = {
  descricao?: string;
};

export type UsuarioResponsavelAcao = {
  nome?: string;
  email?: string;
};

export type UsuarioAlteracaoAcao = {
  nome?: string;
  email?: string;
};

export type AcaoProps = {
  id: string;
  nome_organizador: string;
  celular: string;
  titulo_acao: string;
  descricao_acao: string;
  id_categoria: string;
  data_acao: Date;
  forma_realizacao_acao: string;
  link_divulgacao_acesso_acao: string;
  nome_local_acao: string;
  endereco_local_acao: string;
  informacoes_acao: string;
  link_para_inscricao_acao: string;
  tipo_publico_acao: string;
  orientacao_divulgacao_acao: string;
  numero_organizadores_acao: number;

  situacao_acao: string;
  receber_informacao_patrocinio: boolean;
  data_cadastro: Date;
  data_atualizacao: Date;
  id_usuario_responsavel: string;
  id_usuario_alteracao: string;

  categoria?: CategoriaAcao;
  usuario_responsavel?: UsuarioResponsavelAcao;
  usuario_alteracao?: UsuarioAlteracaoAcao;
};

type OmitirDadosNovaAcaoProps =
  | 'id'
  | 'data_cadastro'
  | 'data_atualizacao'
  | 'data_acao'
  | 'receber_informacao_patrocinio'
  | 'situacao_acao';

type NovaAcaoProps = Omit<AcaoProps, OmitirDadosNovaAcaoProps> & {
  data_acao: string;
};

export default class Acao {
  private constructor(private readonly props: AcaoProps) {}

  public static criarNovaAcao(acao: NovaAcaoProps) {
    this.validacao(acao);

    return new Acao({
      ...acao,
      id: gerarUuid(),
      id_usuario_alteracao: acao.id_usuario_responsavel,
      receber_informacao_patrocinio: false,
      situacao_acao: AcaoSituacao.AguardandoConfirmacao,
      data_acao: new Date(acao.data_acao),
      data_cadastro: new Date(),
      data_atualizacao: new Date(),
    });
  }

  public static carregarAcaoExistente(props: AcaoProps) {
    return new Acao(props);
  }

  private static validacao(dadosParaValidar: NovaAcaoProps) {
    const {
      nome_organizador,
      celular,
      titulo_acao,
      descricao_acao,
      id_categoria,
      data_acao,
      forma_realizacao_acao,
      link_divulgacao_acesso_acao,
      nome_local_acao,
      endereco_local_acao,
      informacoes_acao,
      tipo_publico_acao,
      orientacao_divulgacao_acao,
      numero_organizadores_acao,
      id_usuario_responsavel,
    } = dadosParaValidar;

    const realizacaoOnline = forma_realizacao_acao === AcaoFormaRealizacao.Online;
    const realizacaoHibrida = forma_realizacao_acao === AcaoFormaRealizacao.Hibrida;
    const realizacaoPresencial = forma_realizacao_acao === AcaoFormaRealizacao.Presencial;

    this.validarNomeOrganizador(nome_organizador);
    this.validarCelular(celular);
    this.validarTituloAcao(titulo_acao);
    this.validarDescricaoAcao(descricao_acao);
    this.validarIdCategoria(id_categoria);
    this.validarDataAcao(data_acao);
    this.validarFormaRealizacaoAcao(forma_realizacao_acao);

    if (realizacaoOnline || realizacaoHibrida) {
      this.validarLinkDivulgacaoAcessoAcao(link_divulgacao_acesso_acao);
    }

    if (realizacaoHibrida || realizacaoPresencial) {
      this.validarNomeLocalAcao(nome_local_acao);
      this.validarEnderecoLocalAcao(endereco_local_acao);
    }

    if (realizacaoHibrida) {
      this.validarInformacoesAcao(informacoes_acao);
    }

    this.validarTipoPublicoAcao(tipo_publico_acao);
    this.validarIdUsuarioResponsavel(id_usuario_responsavel);
    this.validarNumeroOrganizadoresAcao(numero_organizadores_acao);
    this.validarOrientacaoDivulgacao(orientacao_divulgacao_acao);
  }

  private static validarTituloAcao(tituloAcao: string) {
    if (!tituloAcao) throw new Error('A ação deve possuir um título.');
  }

  private static validarCelular(celular: string) {
    if (!celular) throw new Error('A ação deve possuir um número de celular.');

    if (celular.length !== 11) throw new Error('Número de celular inválido.');
  }

  private static validarDataAcao(dataAcao: string) {
    if (!dataAcao) throw new Error('A ação deve possuir uma data de realização.');

    const dataAtual = new Date();
    const dataAcaoSolicitada = new Date(dataAcao);

    if (isNaN(dataAcaoSolicitada.getTime())) throw new Error('Data de ação inválida.');

    if (dataAcaoSolicitada <= dataAtual)
      throw new Error('Data de ação deve ser posterior a data atual.');
  }

  private static validarDescricaoAcao(descricao: string) {
    if (!descricao) throw new Error('A ação deve possuir uma descrição.');
  }

  private static validarFormaRealizacaoAcao(formaRealizacaoAcao: string) {
    if (!formaRealizacaoAcao) throw new Error('A ação deve possuir uma forma de realização.');

    const formaAcaoValida = Object.values(AcaoFormaRealizacao).includes(
      formaRealizacaoAcao as AcaoFormaRealizacao
    );

    if (!formaAcaoValida) throw new Error('Forma de realização inválida.');
  }

  private static validarIdCategoria(idCategoria: string) {
    if (!idCategoria) throw new Error('A ação deve possuir uma categoria informada.');
  }

  private static validarIdUsuarioResponsavel(idUsuarioResponsavel: string) {
    if (!idUsuarioResponsavel) throw new Error('A ação deve possuir um usuário responsável.');
  }

  private static validarLinkDivulgacaoAcessoAcao(linkOrganizador: string) {
    if (!linkOrganizador) throw new Error('A ação deve possuir um link de organizador.');
  }

  private static validarLocalAcao(localAcao: string) {
    if (!localAcao) throw new Error('A ação deve possuir um local de realização.');
  }

  private static validarNomeOrganizador(nomeOrganizador: string) {
    if (!nomeOrganizador) throw new Error('A ação deve possuir um nome de organizador.');
  }

  private static validarNumeroOrganizadoresAcao(numeroOrganizadoresAcao: number) {
    if (!numeroOrganizadoresAcao || numeroOrganizadoresAcao < 1)
      throw new Error('A ação deve possuir o número aproximado de organizadores');
  }

  private static validarTipoPublicoAcao(tipo_publico_acao: string) {
    if (!tipo_publico_acao)
      throw new Error('A ação deve possuir a informação de tipo de público externo ou interno.');

    const formaAcaoValida = Object.values(AcaoTipoPublico).includes(
      tipo_publico_acao as AcaoTipoPublico
    );

    if (!formaAcaoValida) throw new Error('Tipo de público inválido.');
  }

  private static validarOrientacaoDivulgacao(orientacaoDivulgacao: string) {
    if (!orientacaoDivulgacao)
      throw new Error(
        'A ação deve possuir uma descrição contendo orientações de como será divulgada.'
      );
  }

  private static validarNomeLocalAcao(nome_local_acao: string) {
    if (!nome_local_acao)
      throw new Error('A ação deve possuir o nome do local onde será realizada.');
  }

  private static validarEnderecoLocalAcao(endereco_local_acao: string) {
    if (!endereco_local_acao)
      throw new Error('A ação deve possuir o endereço do local onde será realizada.');
  }

  private static validarInformacoesAcao(informacoes_acao: string) {
    if (!informacoes_acao)
      throw new Error('A ação deve possuir informações de como a ação será realizada.');
  }

  public get id(): string {
    return this.props.id;
  }

  public get celular(): string {
    return this.props.celular;
  }

  public get nome_organizador(): string {
    return this.props.nome_organizador;
  }

  public get link_divulgacao_acesso_acao(): string {
    return this.props.link_divulgacao_acesso_acao;
  }

  public get link_para_inscricao_acao(): string {
    return this.props.link_para_inscricao_acao;
  }

  public get titulo_acao(): string {
    return this.props.titulo_acao;
  }

  public get descricao_acao(): string {
    return this.props.descricao_acao;
  }

  public get forma_realizacao_acao(): string {
    return this.props.forma_realizacao_acao;
  }

  public get forma_realizacao_acao_texto() {
    switch (this.forma_realizacao_acao) {
      case AcaoFormaRealizacao.Online:
        return 'Online';
      case AcaoFormaRealizacao.Hibrida:
        return 'Hibrida';
      case AcaoFormaRealizacao.Presencial:
        return 'Presencial';
      default:
        return '';
    }
  }

  public get nome_local_acao(): string {
    return this.props.nome_local_acao;
  }

  public get endereco_local_acao(): string {
    return this.props.endereco_local_acao;
  }

  public get numero_organizadores_acao(): number {
    return this.props.numero_organizadores_acao;
  }

  public get receber_informacao_patrocinio(): boolean {
    return this.props.receber_informacao_patrocinio;
  }

  public get situacao_acao(): string {
    return this.props.situacao_acao;
  }

  public get data_acao(): Date {
    return this.props.data_acao;
  }

  public get data_cadastro(): Date {
    return this.props.data_cadastro;
  }

  public get data_atualizacao(): Date {
    return this.props.data_atualizacao;
  }

  public get id_categoria(): string {
    return this.props.id_categoria;
  }

  public get id_usuario_responsavel(): string {
    return this.props.id_usuario_responsavel;
  }

  public get id_usuario_alteracao(): string {
    return this.props.id_usuario_alteracao;
  }

  public get categoria(): CategoriaAcao | undefined {
    return this.props.categoria;
  }

  public get usuario_responsavel(): UsuarioResponsavelAcao | undefined {
    return this.props.usuario_responsavel;
  }

  public get usuario_alteracao(): UsuarioAlteracaoAcao | undefined {
    return this.props.usuario_alteracao;
  }

  public get tipo_publico_acao() {
    return this.props.tipo_publico_acao;
  }

  public get tipo_publico_acao_texto() {
    switch (this.tipo_publico_acao) {
      case AcaoTipoPublico.Interno:
        return 'Interno';
      case AcaoTipoPublico.Externo:
        return 'Externo';
      default:
        return '';
    }
  }

  public get orientacao_divulgacao_acao() {
    return this.props.orientacao_divulgacao_acao;
  }

  public get informacoes_acao() {
    return this.props.informacoes_acao;
  }
}
