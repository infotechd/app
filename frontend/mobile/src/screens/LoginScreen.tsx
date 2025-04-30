import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';

// 1. Importar o hook useAuth e a função da API (renomeada)
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';

// Importar tipos de navegação e ParamList centralizados
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList} from '../navigation/types';


// 4. Definir o tipo das props para LoginScreen
type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Tela de 'login'.
 * Coleta email e senha, chama a API de 'login' e atualiza o AuthContext.
 */
export default function LoginScreen({ navigation }: LoginScreenProps) {
  // 5. Tipar o estado local
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false); // Estado para feedback de carregamento

  // 6. Obter a função de login do contexto
  const { login: contextLogin } = useAuth();

  // 7. Refatorar handleLogin
  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha email e senha.');
      return;
    }

    setIsLoggingIn(true); // Ativa o indicador de carregamento
    // Dentro da função handleLogin em LoginScreen.tsx

    try {
      console.log(`[Login Mobile] Tentando enviar para: ${process.env.EXPO_PUBLIC_API_URL}/auth/login`); // Confirme a URL
      console.log(`[Login Mobile] Enviando email: ${email}`); // Evite logar senha se possível

      // Chama a função da API tipada
      const loginResponse = await apiLogin(email, senha); // apiLogin vem de '../services/api'

      console.log('[Login Mobile] Resposta da API recebida:', loginResponse);

      // Prepara o objeto User para o contexto (ajuste conforme sua interface User no AuthContext)
      const userForContext = {
        ...loginResponse.user,
        token: loginResponse.token
      };

      // Chama a função login do AuthContext
      await contextLogin(userForContext);

      console.log('[Login Mobile] Contexto atualizado. Navegando para Home...');
      navigation.navigate('Home');

    } catch (error: any) { // Captura qualquer tipo de erro
      console.error('--- ERRO DETALHADO NO LOGIN MOBILE ---');
      // Loga diferentes propriedades do erro que podem existir
      if (error instanceof Error) {
        console.error('Mensagem de Erro:', error.message);
        console.error('Nome do Erro:', error.name);
        console.error('Stack Trace:', error.stack);
      } else {
        // Se não for um objeto Error padrão
        console.error('Objeto de Erro Completo:', error);
      }
      console.error('--------------------------------------');

      // Exibe o alerta para o usuário
      Alert.alert(
        'Erro no Login',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido. Verifique os logs.'
      );
    } finally {
      setIsLoggingIn(false); // Desativa o indicador de carregamento
    }

  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        editable={!isLoggingIn} // Desabilita input durante o login
      />
      <TextInput
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        style={styles.input}
        editable={!isLoggingIn} // Desabilita input durante o login
      />
      <Button
        title={isLoggingIn ? "Entrando..." : "Entrar"}
        onPress={handleLogin}
        disabled={isLoggingIn} // Desabilita botão durante o login
      />
      {/* Botão para ir para Cadastro (Exemplo) */}
      <View style={styles.linkContainer}>
        <Button
          title="Não tem conta? Cadastre-se"
          onPress={() => navigation.navigate('Registration')}
          disabled={isLoggingIn}
        />
      </View>
    </View>
  );
}

// Estilos básicos (opcional, apenas para melhorar a aparência)
const styles = StyleSheet.create({
  container: {
    flex: 1, // Faz o container ocupar a tela toda
    justifyContent: 'center', // Centraliza o conteúdo verticalmente
    padding: 20,
  },
  title: {
    fontSize: 24, // Aumenta o tamanho do título
    fontWeight: 'bold', // Deixa o título em negrito
    marginBottom: 20, // Aumenta o espaço abaixo do título
    textAlign: 'center', // Centraliza o título
  },
  input: {
    borderWidth: 1, // Adiciona borda completa
    borderColor: '#ccc', // Cor da borda cinza claro
    borderRadius: 5, // Bordas arredondadas
    padding: 10, // Espaçamento interno
    marginBottom: 15, // Aumenta o espaço abaixo de cada input
    fontSize: 16, // Tamanho da fonte do input
  },
  linkContainer: {
    marginTop: 20, // Adiciona espaço acima do link de cadastro
  },
});