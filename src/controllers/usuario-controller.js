import { PrismaClient } from '@prisma/client';
import { UsuarioRN } from '../business/usuarioRN.js';

const prisma = new PrismaClient();
const usuarioRN = new UsuarioRN(prisma);

export async function create(req, res) {
  try {
    const usuarioResponse = await usuarioRN.criarUsuario(req.body);
    res.status(201).json({ id: usuarioResponse });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function getAll(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const { users, totalUsers } = await usuarioRN.listarUsuarios(pageNumber, limitNumber);

    const totalPages = Math.ceil(totalUsers / limitNumber);

    res.status(200).json({
      users,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function remove(req, res) {
  try {
    const usuarioResponse = await usuarioRN.deletarUsuarioPorId(req.params.id);
    res.status(200).json(usuarioResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function auth(req, res) {
  try {
    const usuarioResponse = await usuarioRN.buscarPorLogin(req.body);
    res.status(200).json(usuarioResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
