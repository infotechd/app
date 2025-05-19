/**
 * @deprecated Este arquivo está mantido apenas para compatibilidade.
 * Importe os schemas diretamente de '../schemas/user.schema.ts'.
 */

import {
  userSchema,
  userRoleSchema,
  tipoUsuarioEnumSchema,
  profileUpdateDataSchema as userUpdateSchema
} from '../schemas/user.schema';

// Re-exporta os schemas para manter compatibilidade
export {
  userSchema,
  userRoleSchema,
  tipoUsuarioEnumSchema,
  userUpdateSchema
};

// Re-exporta os tipos inferidos para manter compatibilidade
import { z } from 'zod';
export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
