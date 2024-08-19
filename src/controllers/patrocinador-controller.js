import { PatrocionadorRN } from "../business/patrocinadorRN.js";

const patrocionadorRN = new PatrocionadorRN();

export async function create(req, res) {
    try {
        const patrocinio = await patrocionadorRN.criarPatrocinio(req.body);

        res.status(201).json(patrocinio);
    } catch (error) {
        console.log("error", error)
        res.status(400).json({ error: error.message });
    }
}

export async function getAll(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        const { partnes, totalPartnes } = await patrocionadorRN.listarPatrocinios(pageNumber, limitNumber);

        const totalPages = Math.ceil(totalPartnes / limitNumber);

        res.status(200).json({
            partnes,
            totalPages,
            currentPage: pageNumber,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
