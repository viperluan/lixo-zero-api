import { Usecase } from '../usecase';

import jwt from 'jsonwebtoken';

export const ERRO_TOKEN_EXPIRADO = 'Token expirado.';

export type TokenDecodificado = {
  id: string;
  email: string;
  nome: string;
  tipo: string;
  iat: number;
};

type VerificarTokenUsuarioEntradaDTO = {
  token: string;
};

type VerificarTokenUsuarioSaidaDTO = {
  id: string;
  email: string;
  nome: string;
  tipo: string;
  iat: number;
};

export default class VerificarTokenUsuario
  implements Usecase<VerificarTokenUsuarioEntradaDTO, VerificarTokenUsuarioSaidaDTO>
{
  public async executar({
    token,
  }: VerificarTokenUsuarioEntradaDTO): Promise<VerificarTokenUsuarioSaidaDTO> {
    try {
      const tokenDecodificado = jwt.verify(token, process.env.SECRET_KEY as string, {
        algorithms: ['HS256'],
      }) as TokenDecodificado;

      return tokenDecodificado;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error(ERRO_TOKEN_EXPIRADO);
      }

      throw error;
    }
  }
}
