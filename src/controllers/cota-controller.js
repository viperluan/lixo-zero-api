import { CotaRN } from '../business/cotaRN.js';

const cotaRN = new CotaRN();

export async function create(req, res) {
  try {
    const { descricao } = req.body;

    const categoria = await cotaRN.criarCota(descricao);

    res.status(201).json(categoria);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function getAll(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const { quotas, totalQuotas } = await cotaRN.listarCota(pageNumber, limitNumber);

    const totalPages = Math.ceil(totalQuotas / limitNumber);

    res.status(200).json({
      quotas,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
