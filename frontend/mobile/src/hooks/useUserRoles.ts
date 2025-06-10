import { useState } from 'react';
import { Alert } from 'react-native';
import { User, UserRole } from '@/types/user';
import { updateProfile } from '@/services/api';
import { rolesToBooleanProps, booleanPropsToRoles } from '@/utils/permissions';

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

      // Converter as flags booleanas atuais para array de roles
      const currentRoles = user.roles || booleanPropsToRoles({
        isComprador: user.isComprador,
        isPrestador: user.isPrestador,
        isAnunciante: user.isAnunciante,
        isAdmin: user.isAdmin
      });

      // Mapear a propriedade booleana para o nome do papel
      const roleMap: Record<string, UserRole> = {
        'isComprador': 'comprador',
        'isPrestador': 'prestador',
        'isAnunciante': 'anunciante',
        'isAdmin': 'admin'
      };

      const userRole = roleMap[role];

      // Atualizar o array de roles
      let updatedRoles: UserRole[];
      if (newValue && !currentRoles.includes(userRole)) {
        // Adicionar o papel se ele não existir e o novo valor for true
        updatedRoles = [...currentRoles, userRole];
      } else if (!newValue) {
        // Remover o papel se o novo valor for false
        updatedRoles = currentRoles.filter(r => r !== userRole);
      } else {
        // Manter os papéis inalterados se o papel já existir e o novo valor for true
        updatedRoles = [...currentRoles];
      }

      // Converter o array de roles atualizado para flags booleanas
      const booleanProps = rolesToBooleanProps(updatedRoles);

      // Criar uma cópia do usuário atual para modificação
      const userUpdate = {
        user: {
          // Incluir apenas os campos necessários
          idUsuario: user.idUsuario,
          id: user.id,
          _id: user._id,
          nome: user.nome,
          email: user.email,
          // Incluir o array de roles atualizado
          roles: updatedRoles,
          // Incluir as flags booleanas atualizadas
          ...booleanProps
        }
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

        // Garantir que o objeto tenha tanto o array de roles quanto as flags booleanas sincronizadas
        if (updatedUserData.roles && !updatedUserData.isComprador && !updatedUserData.isPrestador && 
            !updatedUserData.isAnunciante && !updatedUserData.isAdmin) {
          // Se temos roles mas não temos as flags booleanas, derivar as flags dos roles
          const derivedBooleanProps = rolesToBooleanProps(updatedUserData.roles);
          updatedUserData = {
            ...updatedUserData,
            ...derivedBooleanProps
          };
        } else if (!updatedUserData.roles && (updatedUserData.isComprador || updatedUserData.isPrestador || 
                  updatedUserData.isAnunciante || updatedUserData.isAdmin)) {
          // Se temos as flags booleanas mas não temos o array de roles, derivar os roles das flags
          updatedUserData.roles = booleanPropsToRoles({
            isComprador: updatedUserData.isComprador,
            isPrestador: updatedUserData.isPrestador,
            isAnunciante: updatedUserData.isAnunciante,
            isAdmin: updatedUserData.isAdmin
          });
        }
      } else {
        // Fallback: usar o objeto de atualização que já criamos, que contém tanto
        // o array de roles quanto as flags booleanas sincronizadas
        updatedUserData = { 
          ...user,
          ...userUpdate
        };

        // Garantir que o token seja mantido
        if (user.token) {
          updatedUserData.token = user.token;
        }
      }

      // Garantir que todos os papéis estejam definidos explicitamente e sincronizados
      if (!updatedUserData.roles) {
        updatedUserData.roles = booleanPropsToRoles({
          isComprador: updatedUserData.isComprador,
          isPrestador: updatedUserData.isPrestador,
          isAnunciante: updatedUserData.isAnunciante,
          isAdmin: updatedUserData.isAdmin
        });
      }

      const syncedBooleanProps = rolesToBooleanProps(updatedUserData.roles);
      updatedUserData = {
        ...updatedUserData,
        ...syncedBooleanProps
      };

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
