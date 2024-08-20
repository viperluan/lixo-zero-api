import { CategoriaRN } from '../business/categoriaRN';

const categoriaRN = new CategoriaRN();

export async function create(req, res) {
  try {
    const { descricao } = req.body;

    const categoria = await categoriaRN.criarCategoria(descricao);

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

    const { categories, totalCategories } = await categoriaRN.listarCategorias(
      pageNumber,
      limitNumber
    );

    const totalPages = Math.ceil(totalCategories / limitNumber);

    res.status(200).json({
      categories,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
