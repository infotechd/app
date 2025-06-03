/**
 * @deprecated Este arquivo está mantido apenas para compatibilidade.
 * Importe os schemas diretamente de '../schemas/user.schema.ts'.
 * 
 * Este arquivo serve como um ponto de compatibilidade para código legado,
 * redirecionando importações para o novo local dos schemas de usuário.
 */

// Importação dos schemas do usuário do novo local
import {
  userSchema, // Schema para validação de dados do usuário
  userRoleSchema, // Schema para validação de papéis/funções do usuário
  tipoUsuarioEnumSchema, // Schema para validação de tipos de usuário
  profileUpdateDataSchema as userUpdateSchema // Schema para validação de dados de atualização de perfil
} from '../schemas/user.schema';

// Re-exporta os schemas para manter compatibilidade com código existente
// que ainda importa deste arquivo em vez do novo local
export {
  userSchema, // Schema de usuário
  userRoleSchema, // Schema de papel/função do usuário
  tipoUsuarioEnumSchema, // Schema de tipo de usuário
  userUpdateSchema // Schema de atualização de usuário
};

// Re-exporta os tipos inferidos para manter compatibilidade com código existente
import { z } from 'zod'; // Biblioteca Zod para validação de esquemas

// Definição de tipos TypeScript baseados nos schemas Zod
export type UserRole = z.infer<typeof userRoleSchema>; // Tipo para papel/função do usuário
export type User = z.infer<typeof userSchema>; // Tipo para dados completos do usuário
export type UserUpdate = z.infer<typeof userUpdateSchema>; // Tipo para dados de atualização do usuário
