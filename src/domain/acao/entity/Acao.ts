import { v4 as gerarUuid } from 'uuid';
import { AcaoSituacao } from '../enum/AcaoSituacao';
import { AcaoFormaRealizacao } from '../enum/AcaoFormaRealizacao';

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
  celular: string;
  nome_organizador: string;
  link_organizador: string;
  titulo_acao: string;
  descricao_acao: string;
  forma_realizacao_acao: string;
  local_acao: string;
  numero_organizadores_acao: number;
  receber_informacao_patrocinio: boolean;
  situacao_acao: string;
  tipo_publico: string;
  orientacao_divulgacao: string;
  data_acao: Date;
  data_cadastro: Date;
  data_atualizacao: Date;
  id_categoria: string;
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
      celular,
      data_acao,
      descricao_acao,
      forma_realizacao_acao,
      id_categoria,
      id_usuario_responsavel,
      link_organizador,
      local_acao,
      nome_organizador,
      numero_organizadores_acao,
      titulo_acao,
    } = dadosParaValidar;

    this.validarTituloAcao(titulo_acao);
    this.validarCelular(celular);
    this.validarDataAcao(data_acao);
    this.validarDescricaoAcao(descricao_acao);
    this.validarFormaRealizacaoAcao(forma_realizacao_acao);
    this.validarIdCategoria(id_categoria);
    this.validarIdUsuarioResponsavel(id_usuario_responsavel);
    this.validarLinkOrganizador(link_organizador);
    this.validarLocalAcao(local_acao);
    this.validarNomeOrganizador(nome_organizador);
    this.validarNumeroOrganizadoresAcao(numero_organizadores_acao);
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

  private static validarLinkOrganizador(linkOrganizador: string) {
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

  public get id(): string {
    return this.props.id;
  }

  public get celular(): string {
    return this.props.celular;
  }

  public get nome_organizador(): string {
    return this.props.nome_organizador;
  }

  public get link_organizador(): string {
    return this.props.link_organizador;
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

  public get local_acao(): string {
    return this.props.local_acao;
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

  public get tipo_publico() {
    return this.props.tipo_publico;
  }

  public get orientacao_divulgacao() {
    return this.props.orientacao_divulgacao;
  }
}
