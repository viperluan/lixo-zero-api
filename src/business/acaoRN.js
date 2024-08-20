import { PrismaClient } from '@prisma/client';

class AcaoRN {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async listarAcoes(filters, pageNumber = 1, limitNumber = 10) {
    const where = {};

    if (filters.id_categoria) {
      where.id_categoria = parseInt(filters.id_categoria);
    }

    if (filters.id_usuario) {
      where.id_usuario_responsavel = parseInt(filters.id_usuario);
    }

    if (filters.data_acao) {
      where.data_acao = new Date(filters.data_acao);
    }

    if (filters.search) {
      where.OR = [
        { titulo_acao: { contains: filters.search, mode: 'insensitive' } },
        { descricao_acao: { contains: filters.search, mode: 'insensitive' } },
        { nome_organizador: { contains: filters.search, mode: 'insensitive' } },
        { local_acao: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.situacao) {
      where.situacao_acao = filters.situacao;
    }

    if (filters.forma_realizacao_acao) {
      where.forma_realizacao_acao = filters.forma_realizacao_acao;
    }

    const [actions, totalActions] = await Promise.all([
      this.prisma.acao.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        select: {
          id: true,
          titulo_acao: true,
          descricao_acao: true,
          nome_organizador: true,
          link_organizador: true,
          data_acao: true,
          forma_realizacao_acao: true,
          local_acao: true,
          situacao_acao: true,
          numero_organizadores_acao: true,
          celular: true,
          receber_informacao_patrocionio: true,
          data_cadastro: true,
          data_atualizacao: true,
          categoria: {
            select: {
              descricao: true,
            },
          },
          usuario_responsavel: {
            select: {
              nome: true,
              email: true,
            },
          },
          usuario_alteracao: {
            select: {
              nome: true,
              email: true,
            },
          },
          id_usuario_responsavel: false,
          id_categoria: false,
          id_categoria: false,
        },
      }),
      this.prisma.acao.count({ where }),
    ]);

    return { actions, totalActions };
  }

  async buscarPorData(strData) {
    const dataObj = new Date(strData);
    if (isNaN(dataObj.getTime())) {
      throw new Error('Data inválida.');
    }

    return await this.prisma.acao.findMany({
      where: {
        data_acao: {
          equals: dataObj,
        },
      },
      select: {
        titulo_acao: true,
        descricao_acao: true,
        nome_organizador: true,
        link_organizador: true,
        data_acao: true,
        forma_realizacao_acao: true,
        local_acao: true,
        situacao_acao: true,
        numero_organizadores_acao: true,
        celular: true,
        receber_informacao_patrocionio: true,
        data_cadastro: true,
        data_atualizacao: true,
        categoria: true,
        usuario_responsavel: true,
        usuario_alteracao: true,
        id_usuario_responsavel: false,
        id_categoria: false,
        id_categoria: false,
      },
    });
  }

  async buscarPorIntervaloData(strDataInicial, strDataFinal) {
    const dataInicioObj = new Date(strDataInicial);
    const dataFimObj = new Date(strDataFinal);

    if (isNaN(dataInicioObj.getTime())) {
      throw new Error('Data inicial inválida.');
    }

    if (isNaN(dataFimObj.getTime())) {
      throw new Error('Data final inválida.');
    }

    if (dataInicioObj > dataFimObj) {
      throw new Error('A data de início deve ser anterior à data de fim.');
    }

    return await this.prisma.acao.findMany({
      where: {
        data_acao: {
          gte: dataInicioObj,
          lte: dataFimObj,
        },
      },
      select: {
        titulo_acao: true,
        descricao_acao: true,
        nome_organizador: true,
        link_organizador: true,
        data_acao: true,
        forma_realizacao_acao: true,
        local_acao: true,
        situacao_acao: true,
        numero_organizadores_acao: true,
        celular: true,
        receber_informacao_patrocionio: true,
        data_cadastro: true,
        data_atualizacao: true,
        categoria: true,
        usuario_responsavel: true,
        usuario_alteracao: true,
        id_usuario_responsavel: false,
        id_categoria: false,
        id_categoria: false,
      },
    });
  }

  async criarAcao(data) {
    this.validarInsercao(data);
    const id_usuario_responsavel = data.id_usuario_responsavel;
    const celular = data.celular;
    const nome_organizador = data.nome_organizador;
    const link_organizador = data.link_organizador;
    const titulo_acao = data.titulo_acao;
    const descricao_acao = data.descricao_acao;
    const id_categoria = data.id_categoria;
    const data_acao = data.data_acao;
    const forma_realizacao_acao = data.forma_realizacao_acao;
    const local_acao = data.local_acao;
    const numero_organizadores_acao = data.numero_organizadores_acao;
    const situacao_acao = data.situacao_acao;

    return (
      await this.prisma.acao.create({
        data: {
          usuario_responsavel: {
            connect: {
              id: id_usuario_responsavel,
            },
          },
          categoria: {
            connect: {
              id: id_categoria,
            },
          },
          celular,
          nome_organizador,
          link_organizador,
          titulo_acao,
          descricao_acao,
          data_acao,
          forma_realizacao_acao,
          local_acao,
          numero_organizadores_acao,
          situacao_acao,
        },
      })
    ).id;
  }

  async atualizarAcao(id, fields) {
    if (!id) throw new Error('Id não informado');

    return await this.prisma.acao.update({
      data: {
        situacao_acao: fields.situacao_acao,
        id_usuario_alteracao: fields.id_usuario_alteracao,
      },
      where: {
        id: parseInt(id),
      },
    });
  }

  // VALIDAÇÕES
  validarInsercao(acao) {
    this.validarIdUsuarioResponsavel(acao.id_usuario_responsavel);
    this.validarCelular(acao.celular);
    this.validarNomeOrganizador(acao.nome_organizador);
    this.validarLinkOrganizador(acao.link_organizador);
    this.validarTituloAcao(acao.titulo_acao);
    this.validarDescricaoAcao(acao.descricao_acao);
    this.validarIdCategoria(acao.id_categoria);
    this.validarDataAcao(acao.data_acao);
    this.validarFormaRealizacaoAcao(acao.forma_realizacao_acao);
    this.validarLocalAcao(acao.local_acao);
    this.validarNumeroOrganizadoresAcao(acao.numero_organizadores_acao);
    this.validarSituacaoAcao(acao.situacao_acao);
  }

  validarIdUsuarioResponsavel(id) {
    if (typeof id !== 'number' || id === null) {
      throw new Error('ID de usuário responsável não informado.');
    }
  }

  validarCelular(celular) {
    if (typeof celular !== 'string' || celular.length !== 11) {
      throw new Error('Número de celular inválido ou não informado.');
    }
  }

  validarNomeOrganizador(nome) {
    if (typeof nome !== 'string' || nome.length === 0 || nome.length > 60) {
      throw new Error('Nome de organizador inválido ou não informado.');
    }
  }

  validarLinkOrganizador(link) {
    if (typeof link !== 'string' || link.length === 0) {
      throw new Error('Ao menos um link de organizador deve ser informado.');
    }
  }

  validarTituloAcao(titulo) {
    if (typeof titulo !== 'string' || titulo.length === 0) {
      throw new Error('A ação deve possuir um título.');
    }
  }

  validarDescricaoAcao(descricao) {
    if (typeof descricao !== 'string' || descricao.length === 0) {
      throw new Error('A ação deve possuir uma descrição.');
    }
  }

  validarIdCategoria(id) {
    if (typeof id !== 'number' || id === null) {
      throw new Error('Categoria não informada.');
    }
  }

  validarDataAcao(data) {
    if (typeof data !== 'string' || data.length === 0) {
      throw new Error('Data da ação inválida ou não informada.');
    }

    const dataObj = new Date(data);

    if (isNaN(dataObj.getTime())) {
      throw new Error('Data da ação inválida.');
    }

    if (dataObj <= new Date()) {
      throw new Error('A data da ação deve ser posterior à data atual.');
    }
  }

  validarFormaRealizacaoAcao(forma) {
    if (typeof forma !== 'string') {
      throw new Error('Forma de realização não informada.');
    }
  }

  validarLocalAcao(local) {
    if (typeof local !== 'string' || local.length === 0) {
      throw new Error('Local da ação não informado.');
    }
  }

  validarNumeroOrganizadoresAcao(numero) {
    if (typeof numero !== 'number' || numero === null) {
      throw new Error('Quantidade de organizadores não informado.');
    }
  }

  validarSituacaoAcao(situacao) {
    if (typeof situacao !== 'string') {
      throw new Error('Situação da ação não informada.');
    }
  }

  validarIdUsuarioAlteracao(id) {
    if (typeof id !== 'number' || id === null) {
      throw new Error('Usuário que fez alteração não informado.');
    }
  }
}

export { AcaoRN };
