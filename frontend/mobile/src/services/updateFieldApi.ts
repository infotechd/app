/**
 * Este arquivo contém funções para atualizar campos específicos do perfil do usuário.
 * Utiliza uma função genérica para reduzir duplicação de código e facilitar manutenção.
 * As funções garantem que o ID do usuário seja válido antes de fazer a solicitação à API.
 */
import { ProfileUpdateData, UpdateProfileResponse } from '@/types/api';
import { updateProfile } from './api';

/**
 * Função genérica para atualizar um campo específico do perfil do usuário.
 * @param token - O token JWT do usuário autenticado.
 * @param userId - O ID do usuário (idUsuario ou id).
 * @param fieldName - O nome do campo a ser atualizado.
 * @param fieldValue - O novo valor do campo.
 * @returns Uma Promise que resolve com a resposta da API.
 */
const updateField = async (
  token: string,
  userId: { idUsuario?: string; id?: string },
  fieldName: string,
  fieldValue: string
): Promise<UpdateProfileResponse> => {
  // Garante que o userId tenha pelo menos um campo de ID
  const validUserId = { ...userId };

  // Verifica se temos algum ID disponível
  const availableId = userId.idUsuario || userId.id;

  if (!validUserId.idUsuario && !validUserId.id) {
    console.log(`[updateFieldApi] Adicionando ID para update${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);

    // Se temos um ID disponível, determinar qual campo usar com base no formato
    if (availableId) {
      if (availableId.match(/^[0-9a-fA-F]{24}$/)) {
        // Parece ser um ObjectId do MongoDB, use como id
        validUserId.id = availableId;
        console.log('[updateFieldApi] Usando ID existente como id:', validUserId.id);
      } else {
        // Use como idUsuario por padrão
        validUserId.idUsuario = availableId;
        console.log('[updateFieldApi] Usando ID existente como idUsuario:', validUserId.idUsuario);
      }
    } else {
      // Se não temos nenhum ID, criar um temporário
      validUserId.id = 'temp-id-' + Date.now();
      console.log('[updateFieldApi] ID alternativo criado:', validUserId.id);
    }
  }

  // Verifica novamente se temos pelo menos um campo de ID
  if (!validUserId.idUsuario && !validUserId.id) {
    console.error(`[updateFieldApi] Falha ao criar ID válido para update${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);
    throw new Error("Pelo menos um dos campos 'idUsuario' ou 'id' deve estar presente");
  }

  // Cria o objeto de dados do perfil com o campo atualizado
  const profileData: ProfileUpdateData = {
    user: {
      ...validUserId,
      [fieldName]: fieldValue
    }
  };

  // Envia a solicitação para atualizar o perfil
  return updateProfile(token, profileData);
};

/**
 * Atualiza apenas o campo nome do perfil do usuário.
 * @param token - O token JWT do usuário autenticado.
 * @param userId - O ID do usuário (idUsuario ou id).
 * @param nome - O novo nome do usuário.
 * @returns Uma Promise que resolve com a resposta da API.
 */
export const updateNome = async (
  token: string,
  userId: { idUsuario?: string; id?: string },
  nome: string
): Promise<UpdateProfileResponse> => {
  return updateField(token, userId, 'nome', nome);
};

/**
 * Atualiza apenas o campo telefone do perfil do usuário.
 * @param token - O token JWT do usuário autenticado.
 * @param userId - O ID do usuário (idUsuario ou id).
 * @param telefone - O novo telefone do usuário.
 * @returns Uma Promise que resolve com a resposta da API.
 */
export const updateTelefone = async (
  token: string,
  userId: { idUsuario?: string; id?: string },
  telefone: string
): Promise<UpdateProfileResponse> => {
  return updateField(token, userId, 'telefone', telefone);
};

/**
 * Atualiza apenas o campo endereço do perfil do usuário.
 * @param token - O token JWT do usuário autenticado.
 * @param userId - O ID do usuário (idUsuario ou id).
 * @param endereco - O novo endereço do usuário.
 * @returns Uma Promise que resolve com a resposta da API.
 */
export const updateEndereco = async (
  token: string,
  userId: { idUsuario?: string; id?: string },
  endereco: string
): Promise<UpdateProfileResponse> => {
  return updateField(token, userId, 'endereco', endereco);
};
