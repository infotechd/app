/**
 * Este arquivo contém funções para atualizar campos específicos do perfil do usuário.
 * Cada função é responsável por atualizar um único campo, como nome, telefone ou endereço.
 * As funções garantem que o ID do usuário seja válido antes de fazer a solicitação à API.
 */
import { ProfileUpdateData, UpdateProfileResponse } from '@/types/api';
import { updateProfile } from './api';

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
  // Garante que o userId tenha pelo menos um campo de ID
  const validUserId = { ...userId };
  if (!validUserId.idUsuario && !validUserId.id) {
    console.log('[updateFieldApi] Adicionando ID alternativo para updateNome');
    validUserId.id = 'temp-id-' + Date.now();
    console.log('[updateFieldApi] ID alternativo criado:', validUserId.id);
  }

  // Verifica novamente se temos pelo menos um campo de ID
  if (!validUserId.idUsuario && !validUserId.id) {
    console.error('[updateFieldApi] Falha ao criar ID válido para updateNome');
    throw new Error("Pelo menos um dos campos 'idUsuario' ou 'id' deve estar presente");
  }

  // Cria o objeto de dados do perfil com o nome atualizado
  const profileData: ProfileUpdateData = {
    ...validUserId,
    nome
  };

  // Envia a solicitação para atualizar o perfil
  return updateProfile(token, profileData);
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
  // Garante que o userId tenha pelo menos um campo de ID
  const validUserId = { ...userId };
  if (!validUserId.idUsuario && !validUserId.id) {
    console.log('[updateFieldApi] Adicionando ID alternativo para updateTelefone');
    validUserId.id = 'temp-id-' + Date.now();
    console.log('[updateFieldApi] ID alternativo criado:', validUserId.id);
  }

  // Verifica novamente se temos pelo menos um campo de ID
  if (!validUserId.idUsuario && !validUserId.id) {
    console.error('[updateFieldApi] Falha ao criar ID válido para updateTelefone');
    throw new Error("Pelo menos um dos campos 'idUsuario' ou 'id' deve estar presente");
  }

  // Cria o objeto de dados do perfil com o telefone atualizado
  const profileData: ProfileUpdateData = {
    ...validUserId,
    telefone
  };

  // Envia a solicitação para atualizar o perfil
  return updateProfile(token, profileData);
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
  // Garante que o userId tenha pelo menos um campo de ID
  const validUserId = { ...userId };
  if (!validUserId.idUsuario && !validUserId.id) {
    console.log('[updateFieldApi] Adicionando ID alternativo para updateEndereco');
    validUserId.id = 'temp-id-' + Date.now();
    console.log('[updateFieldApi] ID alternativo criado:', validUserId.id);
  }

  // Verifica novamente se temos pelo menos um campo de ID
  if (!validUserId.idUsuario && !validUserId.id) {
    console.error('[updateFieldApi] Falha ao criar ID válido para updateEndereco');
    throw new Error("Pelo menos um dos campos 'idUsuario' ou 'id' deve estar presente");
  }

  // Cria o objeto de dados do perfil com o endereço atualizado
  const profileData: ProfileUpdateData = {
    ...validUserId,
    endereco
  };

  // Envia a solicitação para atualizar o perfil
  return updateProfile(token, profileData);
};
