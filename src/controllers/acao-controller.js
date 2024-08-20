import { PrismaClient } from '@prisma/client';
import { AcaoRN } from '../business/acaoRN';

const prisma = new PrismaClient();
const acaoRN = new AcaoRN(prisma);

export async function getAll(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      id_categoria,
      id_usuario,
      data_acao,
      search,
      situacao,
      forma_realizacao_acao,
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const filters = {
      id_categoria,
      id_usuario,
      data_acao,
      search,
      situacao,
      forma_realizacao_acao,
    };

    const { actions, totalActions } = await acaoRN.listarAcoes(filters, pageNumber, limitNumber);

    const totalPages = Math.ceil(totalActions / limitNumber);

    res.status(200).json({
      actions,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req, res) {
  try {
    const response = await acaoRN.criarAcao(req.body);
    res.status(201).json({ id: response });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    res.status(201).json(await acaoRN.atualizarAcao(id, req.body));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function buscarPorData(req, res) {
  try {
    const acao = await acaoRN.buscarPorData(req.params.data);
    res.status(200).json(acao);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function buscarPorIntervaloData(req, res) {
  console.log(req.params);
  try {
    const acao = await acaoRN.buscarPorIntervaloData(req.params.dataInicial, req.params.dataFinal);
    res.status(200).json(acao);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
