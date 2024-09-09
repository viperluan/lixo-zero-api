import { v4 as gerarUuid } from 'uuid';

import { PatrocinadorSituacao } from '../enum/PatrocinadorSituacao';

export type PatrocinadorRelacaoCota = {
  descricao?: string;
};

export type PatrocinadorRelacaoUsuarioPatrocinio = {
  nome?: string;
  email?: string;
};

export type PatrocinadorProps = {
  id: string;
  nome: string;
  celular: string;
  descricao: string;
  id_cota: string;
  data_cadastro: Date;
  data_atualizacao: Date;
  situacao: string;
  id_usuario_alteracao: string;
  id_usuario_patrocinio: string;
  cota?: PatrocinadorRelacaoCota;
  usuario_patrocinio?: PatrocinadorRelacaoUsuarioPatrocinio;
};

type OmitirDadosNovoPatrocinadorProps = 'id' | 'data_cadastro' | 'data_atualizacao';

type NovoPatrocinadorProps = Omit<PatrocinadorProps, OmitirDadosNovoPatrocinadorProps>;

export default class Patrocinador {
  private constructor(private readonly props: PatrocinadorProps) {}

  public static criarNovoPatrocinador(novoPatrocinador: NovoPatrocinadorProps) {
    this.validacao(novoPatrocinador);

    return new Patrocinador({
      ...novoPatrocinador,
      id: gerarUuid(),
      data_cadastro: new Date(),
      data_atualizacao: new Date(),
      situacao: PatrocinadorSituacao.Pendente,
    });
  }

  public static carregarPatrocinadorExistente(props: PatrocinadorProps) {
    return new Patrocinador(props);
  }

  private static validacao({ nome, celular, descricao, id_cota }: NovoPatrocinadorProps) {
    this.validarNome(nome);
    this.validarCelular(celular);
    this.validarIdCota(id_cota);
    this.validarDescricao(descricao);
  }

  private static validarNome(nome: string) {
    if (!nome) throw new Error('O patrocínio precisa ter um nome.');
  }

  private static validarCelular(celular: string) {
    if (!celular) throw new Error('O patrocínio precisa ter um número de celular cadastrado.');

    if (celular.length !== 11) throw new Error('Número de celular inválido.');
  }

  private static validarDescricao(descricao: string) {
    if (!descricao) throw new Error('O patrocínio deve possuir uma descrição');

    if (descricao.length > 100) {
      throw new Error('A descrição não pode conter mais de 100 caracteres.');
    }
  }

  private static validarIdCota(idCota: string) {
    if (!idCota) throw new Error('O patrocínio precisa ter uma cota vinculada.');
  }

  public get id(): string {
    return this.props.id;
  }

  public get nome(): string {
    return this.props.nome;
  }

  public get celular(): string {
    return this.props.celular;
  }

  public get descricao(): string {
    return this.props.descricao;
  }

  public get id_cota(): string {
    return this.props.id_cota;
  }

  public get data_cadastro(): Date {
    return this.props.data_cadastro;
  }

  public get data_atualizacao(): Date {
    return this.props.data_atualizacao;
  }

  public get situacao(): string {
    return this.props.situacao;
  }

  public get id_usuario_alteracao(): string {
    return this.props.id_usuario_alteracao;
  }

  public get id_usuario_patrocinio(): string {
    return this.props.id_usuario_patrocinio;
  }

  public get cota() {
    return this.props.cota;
  }

  public get usuario_patrocinio() {
    return this.props.usuario_patrocinio;
  }
}
