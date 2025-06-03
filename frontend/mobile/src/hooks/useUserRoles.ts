import { useState } from 'react';
import { Alert } from 'react-native';
import { User } from '@/types/user';
import { updateProfile } from '@/services/api';

/**
 * Custom hook para gerenciar papéis de usuário
 * Extrai a lógica de negócios relacionada aos papéis do usuário do componente UnifiedDashboardScreen
 * 
 * @param user - O objeto do usuário atual
 * @param updateUser - Função para atualizar o usuário no contexto de autenticação
 * @returns Objeto com funções e estados relacionados aos papéis do usuário
 */
export function useUserRoles(user: User | null, updateUser: (userData: Partial<User>) => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Calcula o número de papéis ativos do usuário
   * @returns Número de papéis ativos
   */
  const getActiveRolesCount = (): number => {
    if (!user) return 0;

    return [
      user.isComprador ? 1 : 0,
      user.isPrestador ? 1 : 0,
      user.isAnunciante ? 1 : 0,
      user.isAdmin ? 1 : 0
    ].reduce((sum, count) => sum + count, 0);
  };

  /**
   * Alterna um papel do usuário (ativar/desativar)
   * @param role - O papel a ser alternado
   * @param newValue - O novo valor (true para ativar, false para desativar)
   * @returns Promise que resolve quando a operação for concluída
   */
  const toggleUserRole = async (
    role: keyof Pick<User, 'isComprador' | 'isPrestador' | 'isAnunciante' | 'isAdmin'>, 
    newValue: boolean
  ): Promise<{ success: boolean; updatedUser?: Partial<User> }> => {
    if (!user) return { success: false };

    // Verificar se o usuário está tentando desativar seu único papel ativo
    const activeRolesCount = getActiveRolesCount();

    // Se o usuário tem apenas um papel ativo e está tentando desativá-lo, mostra um alerta
    if (activeRolesCount === 1 && user[role] === true && newValue === false) {
      Alert.alert(
        "Ação não permitida",
        "Você deve ter pelo menos um papel ativo. Ative outro papel antes de desativar este.",
        [{ text: "OK" }]
      );
      return { success: false };
    }

    setIsLoading(true);

    try {
      // Garantir que pelo menos um dos campos de ID esteja presente
      const userId = user.idUsuario || user.id || user._id;
      if (!userId) {
        throw new Error("ID do usuário não encontrado. Por favor, faça login novamente.");
      }

      // Criar uma cópia do usuário atual para modificação
      const userUpdate = {
        // Incluir apenas os campos necessários
        idUsuario: user.idUsuario,
        id: user.id,
        nome: user.nome,
        email: user.email,
        // Atualizar o papel específico
        [role]: newValue,
        // Manter os outros papéis inalterados
        ...(role !== 'isComprador' && { isComprador: user.isComprador }),
        ...(role !== 'isPrestador' && { isPrestador: user.isPrestador }),
        ...(role !== 'isAnunciante' && { isAnunciante: user.isAnunciante }),
        ...(role !== 'isAdmin' && { isAdmin: user.isAdmin })
      };

      // Enviar o objeto userUpdate diretamente para o backend
      const response = await updateProfile(user.token || '', userUpdate);

      // Criar um objeto com os dados atualizados do usuário
      let updatedUserData: Partial<User> = {};

      // Se a atualização no backend for bem-sucedida e retornar um novo token e dados do usuário
      if (response && response.user && response.token) {
        // Usar os dados completos retornados pelo servidor
        updatedUserData = { 
          ...response.user,
          token: response.token 
        };
      } else {
        // Fallback: criar um objeto com todos os dados do usuário atual
        // e atualizar apenas o papel específico que foi alterado
        updatedUserData = { 
          ...user,
          [role]: newValue 
        };

        // Garantir que o token seja mantido
        if (user.token) {
          updatedUserData.token = user.token;
        }
      }

      // Garantir que todos os papéis estejam definidos explicitamente
      if (updatedUserData.isComprador === undefined) updatedUserData.isComprador = user.isComprador || false;
      if (updatedUserData.isPrestador === undefined) updatedUserData.isPrestador = user.isPrestador || false;
      if (updatedUserData.isAnunciante === undefined) updatedUserData.isAnunciante = user.isAnunciante || false;
      if (updatedUserData.isAdmin === undefined) updatedUserData.isAdmin = user.isAdmin || false;

      // Atualizar o usuário no contexto
      await updateUser(updatedUserData);

      Alert.alert("Sucesso", "Papel atualizado com sucesso!");
      return { success: true, updatedUser: updatedUserData };
    } catch (error) {
      console.error("Erro ao atualizar papel:", error);

      // Verifica se é um erro de token inválido ou expirado
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Token inválido') || 
          errorMessage.includes('Token expirado') || 
          errorMessage.includes('não autorizado')) {

        // Mostra uma mensagem específica para erro de autenticação
        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Por favor, faça login novamente."
        );
      } else {
        // Para outros erros, mostra a mensagem genérica
        Alert.alert("Erro", "Não foi possível atualizar seu papel. Tente novamente.");
      }

      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleUserRole,
    getActiveRolesCount,
    isLoading
  };
}
