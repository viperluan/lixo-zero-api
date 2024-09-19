import { Usecase } from '../usecase';

import jwt from 'jsonwebtoken';

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
    const tokenDecodificado = jwt.verify(
      token,
      process.env.SECRET_KEY as string
    ) as TokenDecodificado;

    return tokenDecodificado;
  }
}
