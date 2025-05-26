import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// 1. Importar hook de autenticação e tipos de navegação
import { useAuth } from "@/context/AuthContext";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types"; // Importa a lista de parâmetros
import { TipoUsuarioEnum } from "@/types/user"; // Importa o enum de tipos de usuário

// 2. Definir tipo das props da tela
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Tela principal exibida após o login do usuário.
 * Redireciona para o dashboard específico do tipo de usuário
 * e mostra botões para as principais funcionalidades.
 */
export default function HomeScreen({ navigation }: HomeScreenProps) {
  // Obter dados do usuário e função de logout do contexto
  const { user, logout } = useAuth();

  // Redirecionar para o dashboard específico do tipo de usuário
  useEffect(() => {
    if (user) {
      // Aguardar um momento para garantir que a tela Home seja montada completamente
      const timer = setTimeout(() => {
        switch (user.tipoUsuario) {
          case TipoUsuarioEnum.COMPRADOR:
            navigation.navigate('BuyerDashboard');
            break;
          case TipoUsuarioEnum.PRESTADOR:
            navigation.navigate('ProviderDashboard');
            break;
          case TipoUsuarioEnum.ANUNCIANTE:
            navigation.navigate('AdvertiserDashboard');
            break;
          case TipoUsuarioEnum.ADMIN:
            // Manter na Home para administradores ou navegar para uma tela específica
            break;
          default:
            console.warn(`Tipo de usuário desconhecido: ${user.tipoUsuario}`);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, navigation]);

  const handleLogout = async () => {
    await logout();
    // A navegação para a tela de Login deve acontecer automaticamente
    // devido à lógica condicional em AppNavigation.tsx quando o 'user' se torna null.
  };

  // Renderizar botões específicos para cada tipo de usuário
  const renderUserSpecificButtons = () => {
    if (!user) return null;

    switch (user.tipoUsuario) {
      case TipoUsuarioEnum.COMPRADOR:
        return (
          <>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('BuscarOfertas')}
            >
              <Text style={styles.buttonText}>Buscar Serviços</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('BuyerDashboard')}
            >
              <Text style={styles.buttonText}>Meu Painel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('TreinamentoList')}
            >
              <Text style={styles.buttonText}>Treinamentos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('Community')}
            >
              <Text style={styles.buttonText}>Comunidade</Text>
            </TouchableOpacity>
          </>
        );

      case TipoUsuarioEnum.PRESTADOR:
        return (
          <>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('OfertaServico', { offerId: '', mode: 'list' })}
            >
              <Text style={styles.buttonText}>Minhas Ofertas</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('ProviderDashboard')}
            >
              <Text style={styles.buttonText}>Meu Painel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('Agenda')}
            >
              <Text style={styles.buttonText}>Minha Agenda</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('CurriculoForm')}
            >
              <Text style={styles.buttonText}>Meu Currículo</Text>
            </TouchableOpacity>
          </>
        );

      case TipoUsuarioEnum.ANUNCIANTE:
        return (
          <>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('TreinamentoCreate')}
            >
              <Text style={styles.buttonText}>Criar Treinamento</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('AdvertiserDashboard')}
            >
              <Text style={styles.buttonText}>Meu Painel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('Relatorio')}
            >
              <Text style={styles.buttonText}>Relatórios</Text>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Usar nome do usuário (com optional chaining '?') */}
        <Text style={styles.title}>Bem-vindo(a), {user?.nome || 'Usuário'}!</Text>

        {/* Informações do usuário */}
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>Email: {user.email}</Text>
            <Text style={styles.userInfoText}>Tipo de Usuário: {user.tipoUsuario}</Text>
          </View>
        )}

        {/* Seção de botões específicos para o tipo de usuário */}
        <View style={styles.buttonContainer}>
          {renderUserSpecificButtons()}
        </View>

        {/* Botões comuns para todos os usuários */}
        <View style={styles.commonButtonsContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('Notificacao')}
          >
            <Text style={styles.buttonText}>Notificações</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.buttonText}>Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.logoutButton]} 
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Sair (Logout)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Estilos aprimorados
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  userInfo: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  userInfoText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  commonButtonsContainer: {
    width: '100%',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    marginTop: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
