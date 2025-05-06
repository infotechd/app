// src/types/express.d.ts

import { DecodedUserToken } from '../server';

// Estende a interface Request do Express para incluir a propriedade 'user'
declare global {
  namespace Express {
    interface Request {
      user?: DecodedUserToken;
    }
  }
}

// Este arquivo não precisa exportar nada, pois apenas estende tipos existentes