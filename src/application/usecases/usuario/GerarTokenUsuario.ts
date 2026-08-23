import { Usecase } from '../usecase';

import jwt from 'jsonwebtoken';

type GerarTokenUsuarioEntradaDTO = {
  id: string;
  nome: string;
  tipo: string;
  email: string;
};

type GerarTokenUsuarioSaidaDTO = {
  token: string;
};

export default class GerarTokenUsuario
  implements Usecase<GerarTokenUsuarioEntradaDTO, GerarTokenUsuarioSaidaDTO>
{
  public async executar(payload: GerarTokenUsuarioEntradaDTO): Promise<GerarTokenUsuarioSaidaDTO> {
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(payload, process.env.SECRET_KEY!, { expiresIn });

    return { token };
  }
}
