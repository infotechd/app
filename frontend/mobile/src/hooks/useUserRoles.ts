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
    if (!user) {
      console.error("toggleUserRole: Nenhum usuário logado");
      return { success: false };
    }

    // Mapear a propriedade booleana para o nome do papel
    const roleMap: Record<string, UserRole> = {
      'isComprador': 'comprador',
      'isPrestador': 'prestador',
      'isAnunciante': 'anunciante',
      'isAdmin': 'admin'
    };

    const userRole = roleMap[role];
    console.log(`toggleUserRole: Alternando papel ${userRole} para ${newValue ? 'ativo' : 'inativo'}`);

    setIsLoading(true);

    try {
      // Verificar se o usuário está tentando desativar seu único papel ativo
      if (!newValue) {
        const activeRolesCount = getActiveRolesCount();
        console.log(`toggleUserRole: Contagem de papéis ativos: ${activeRolesCount}`);

        // Se o usuário tem apenas um papel ativo e está tentando desativá-lo, mostra um alerta
        if (activeRolesCount === 1 && user[role] === true) {
          console.warn("toggleUserRole: Tentativa de desativar o único papel ativo");
          Alert.alert(
            "Ação não permitida",
            "Você deve ter pelo menos um papel ativo. Ative outro papel antes de desativar este.",
            [{ text: "OK" }]
          );
          setIsLoading(false);
          return { success: false };
        }
      }

      // Obter as funções addRole e removeRole do contexto do usuário
      // Precisamos importar essas funções de alguma forma
      // Como não podemos modificar os parâmetros da função, vamos usar uma abordagem alternativa

      // Converter as flags booleanas atuais para array de roles
      const currentRoles = user.roles || booleanPropsToRoles({
        isComprador: user.isComprador,
        isPrestador: user.isPrestador,
        isAnunciante: user.isAnunciante,
        isAdmin: user.isAdmin
      });

      let success: boolean;

      if (newValue) {
        // Adicionar papel se não existir
        if (!currentRoles.includes(userRole)) {
          console.log(`toggleUserRole: Adicionando papel ${userRole}`);

          // Atualizar o usuário com o novo papel
          const updatedRoles = [...currentRoles, userRole];
          const booleanProps = rolesToBooleanProps(updatedRoles);

          await updateUser({ 
            roles: updatedRoles,
            ...booleanProps
          });

          success = true;
        } else {
          console.log(`toggleUserRole: Papel ${userRole} já existe, nenhuma ação necessária`);
          success = true;
        }
      } else {
        // Remover papel se existir
        if (currentRoles.includes(userRole)) {
          console.log(`toggleUserRole: Removendo papel ${userRole}`);

          // Atualizar o usuário sem o papel
          const updatedRoles = currentRoles.filter(r => r !== userRole);
          const booleanProps = rolesToBooleanProps(updatedRoles);

          await updateUser({ 
            roles: updatedRoles,
            ...booleanProps
          });

          success = true;
        } else {
          console.log(`toggleUserRole: Papel ${userRole} não existe, nenhuma ação necessária`);
          success = true;
        }
      }

      if (success) {
        console.log(`toggleUserRole: Papel ${userRole} ${newValue ? 'adicionado' : 'removido'} com sucesso`);

        // Não mostrar alerta aqui, pois a UI já reflete a mudança
        // Alert.alert("Sucesso", "Papel atualizado com sucesso!");

        // Retorna o sucesso e não inclui o usuário, pois o contexto já foi atualizado
        return { 
          success: true
        };
      } else {
        console.error(`toggleUserRole: Falha ao ${newValue ? 'adicionar' : 'remover'} papel ${userRole}`);
        return { success: false };
      }
    } catch (error) {
      console.error("toggleUserRole: Erro ao atualizar papel:", error);

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
