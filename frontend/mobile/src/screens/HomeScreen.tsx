import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// 1. Importar hook de autenticação e tipos de navegação
// Esta seção importa os componentes e hooks necessários para a aplicação
import { useAuth } from "@/context/AuthContext";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types"; // Importa a lista de parâmetros
import { MaterialIcons } from '@expo/vector-icons'; // Importa ícones

// 2. Definir tipo das props da tela
// Esta linha define o tipo de propriedades que a tela Home recebe, utilizando o sistema de navegação do React Navigation
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Tela principal exibida após o login do usuário.
 * Funciona como um hub central que exibe todas as capacidades do usuário,
 * permitindo que ele escolha qual papel deseja utilizar.
 */
export default function HomeScreen({ navigation }: HomeScreenProps) {
  // Obter dados do usuário e função de logout do contexto
  // Esta linha utiliza o hook useAuth para acessar os dados do usuário logado e a função de logout
  const { user, logout } = useAuth();

  // Função que realiza o logout do usuário
  const handleLogout = async () => {
    await logout();
    // A navegação para a tela de Login deve acontecer automaticamente
    // devido à lógica condicional em AppNavigation.tsx quando o 'user' se torna null.
  };

  // Renderizar cards para cada papel do usuário
  // Esta função cria os cards visuais para cada papel que o usuário possui (Comprador, Prestador, Anunciante)
  const renderUserRoleCards = () => {
    // Verifica se existe um usuário logado, caso contrário não renderiza nada
    if (!user) return null;

    return (
      <View style={styles.rolesContainer}>
        {/* Card para Comprador - Esta seção exibe as opções disponíveis para usuários com papel de comprador */}
        {user.isComprador && (
          <TouchableOpacity 
            style={styles.roleCard}
            onPress={() => navigation.navigate('UnifiedDashboard', { initialRole: 'comprador' })}>
            <View style={[styles.roleIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <MaterialIcons name="shopping-cart" size={30} color="#4A90E2" />
            </View>
            <Text style={styles.roleTitle}>Comprador</Text>
            <Text style={styles.roleDescription}>Busque e contrate serviços</Text>
            <View style={styles.roleActions}>
              <TouchableOpacity 
                style={styles.roleActionButton}
                onPress={() => navigation.navigate('BuscarOfertas')}>
                <Text style={styles.roleActionText}>Buscar Serviços</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.roleActionButton}
                onPress={() => navigation.navigate('TreinamentoList')}>
                <Text style={styles.roleActionText}>Treinamentos</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Card para Prestador - Esta seção exibe as opções disponíveis para usuários com papel de prestador de serviços */}
        {user.isPrestador && (
          <TouchableOpacity 
            style={styles.roleCard}
            onPress={() => navigation.navigate('UnifiedDashboard', { initialRole: 'prestador' })}>
            <View style={[styles.roleIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <MaterialIcons name="build" size={30} color="#50C878" />
            </View>
            <Text style={styles.roleTitle}>Prestador</Text>
            <Text style={styles.roleDescription}>Gerencie seus serviços</Text>
            <View style={styles.roleActions}>
              <TouchableOpacity 
                style={styles.roleActionButton}
                onPress={() => navigation.navigate('OfertaServico', { offerId: '', mode: 'list' })}>
                <Text style={styles.roleActionText}>Minhas Ofertas</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.roleActionButton}
                onPress={() => navigation.navigate('Agenda')}>
                <Text style={styles.roleActionText}>Minha Agenda</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Card para Anunciante - Esta seção exibe as opções disponíveis para usuários com papel de anunciante */}
        {user.isAnunciante && (
          <TouchableOpacity 
            style={styles.roleCard}
            onPress={() => navigation.navigate('UnifiedDashboard', { initialRole: 'anunciante' })}>
            <View style={[styles.roleIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <MaterialIcons name="campaign" size={30} color="#FF8C00" />
            </View>
            <Text style={styles.roleTitle}>Anunciante</Text>
            <Text style={styles.roleDescription}>Crie e gerencie anúncios</Text>
            <View style={styles.roleActions}>
              <TouchableOpacity 
                style={styles.roleActionButton}
                onPress={() => navigation.navigate('TreinamentoCreate')}>
                <Text style={styles.roleActionText}>Criar Treinamento</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.roleActionButton}
                onPress={() => navigation.navigate('Relatorio')}>
                <Text style={styles.roleActionText}>Relatórios</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Mensagem se não tiver papéis - Esta seção exibe uma mensagem quando o usuário não possui nenhum papel atribuído */}
        {!user.isComprador && !user.isPrestador && !user.isAnunciante && !user.isAdmin && (
          <View style={styles.noRolesContainer}>
            <MaterialIcons name="error-outline" size={40} color="#999" />
            <Text style={styles.noRolesText}>Você não possui nenhum papel definido</Text>
            <Text style={styles.noRolesSubtext}>Entre em contato com o suporte</Text>
          </View>
        )}
      </View>
    );
  };

  // Renderização principal do componente
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Cabeçalho com boas-vindas - Esta seção exibe uma mensagem de boas-vindas personalizada com o nome do usuário */}
        <View style={styles.header}>
          <Text style={styles.title}>Bem-vindo(a), {user?.nome || 'Usuário'}!</Text>
          <Text style={styles.subtitle}>Selecione um dos seus papéis para começar</Text>
        </View>

        {/* Seção de cards de papéis do usuário - Esta seção renderiza os cards para cada papel que o usuário possui */}
        {renderUserRoleCards()}

        {/* Seção de acesso rápido - Esta seção exibe botões para acesso rápido a funcionalidades comuns como notificações, comunidade e perfil */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={styles.quickAccessButtons}>
            <TouchableOpacity 
              style={styles.quickAccessButton} 
              onPress={() => navigation.navigate('Notificacao')}>
              <MaterialIcons name="notifications" size={24} color="#555" />
              <Text style={styles.quickAccessButtonText}>Notificações</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessButton} 
              onPress={() => navigation.navigate('Community')}>
              <MaterialIcons name="people" size={24} color="#555" />
              <Text style={styles.quickAccessButtonText}>Comunidade</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessButton} 
              onPress={() => navigation.navigate('EditProfile')}>
              <MaterialIcons name="person" size={24} color="#555" />
              <Text style={styles.quickAccessButtonText}>Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botão de logout - Este botão permite que o usuário saia da aplicação, encerrando sua sessão */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}>
          <MaterialIcons name="exit-to-app" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Estilos aprimorados
// Esta seção define todos os estilos visuais utilizados nos componentes da tela
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Estilos para os cards de papéis
  // Define a aparência dos containers que mostram os diferentes papéis do usuário
  rolesContainer: {
    width: '100%',
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  roleActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  roleActionButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  roleActionText: {
    color: '#555',
    fontSize: 14,
  },
  // Estilos para mensagem de nenhum papel
  // Define a aparência da mensagem exibida quando o usuário não possui nenhum papel atribuído
  noRolesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  noRolesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  noRolesSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  // Estilos para seção de acesso rápido
  // Define a aparência da seção que contém os botões de acesso rápido para funcionalidades comuns
  quickAccessSection: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickAccessButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickAccessButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickAccessButtonText: {
    color: '#555',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  // Estilo para botão de logout
  // Define a aparência do botão que permite ao usuário sair da aplicação
  logoutButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    marginTop: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
