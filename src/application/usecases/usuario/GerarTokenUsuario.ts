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
  expires_in: number;
  expires_at: string;
};

export default class GerarTokenUsuario
  implements Usecase<GerarTokenUsuarioEntradaDTO, GerarTokenUsuarioSaidaDTO>
{
  public async executar(payload: GerarTokenUsuarioEntradaDTO): Promise<GerarTokenUsuarioSaidaDTO> {
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(payload, process.env.SECRET_KEY!, { expiresIn, algorithm: 'HS256' });
    const tokenDecodificado = jwt.decode(token);

    if (
      !tokenDecodificado ||
      typeof tokenDecodificado === 'string' ||
      typeof tokenDecodificado.exp !== 'number' ||
      typeof tokenDecodificado.iat !== 'number'
    ) {
      throw new Error('Token gerado sem claims de expiração.');
    }

    return {
      token,
      expires_in: tokenDecodificado.exp - tokenDecodificado.iat,
      expires_at: new Date(tokenDecodificado.exp * 1000).toISOString(),
    };
  }
}
