import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';

// 1. Importar o hook useAuth e a função da API (renomeada)
import { useAuth } from "@/context/AuthContext";
import { login as apiLogin } from '../services/api';

// Importar tipos de navegação e ParamList centralizados
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList} from "@/navigation/types";


// 4. Definir o tipo das props para LoginScreen
type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Tela de 'login'.
 * Coleta 'endereço eletronico e senha, chama a API de 'login' e atualiza o AuthContext.
 */
export default function LoginScreen({ navigation }: LoginScreenProps) {
  // 5. Tipar o estado local
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false); // Estado para feedback de carregamento

  // 6. Obter a função de 'login' do contexto
  const { login: contextLogin } = useAuth();

  // 7. Refatorar handleLogin
  const handleLogin = async () => {
    // Validação mais completa no frontend antes de enviar para a API
    if (!email) {
      Alert.alert('Erro', 'O email é obrigatório.');
      return;
    }

    // Validar formato de email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, insira um endereço de email válido.');
      return;
    }

    if (!senha) {
      Alert.alert('Erro', 'A senha é obrigatória.');
      return;
    }

    // Validar requisitos de senha
    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // Verificar se a senha contém pelo menos uma letra maiúscula, uma minúscula e um número
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!senhaRegex.test(senha)) {
      Alert.alert('Erro', 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.');
      return;
    }

    setIsLoggingIn(true); // Ativa o indicador de carregamento
    // Dentro da função handleLogin em LoginScreen.tsx

    try {
      console.log(`[Login Mobile] Tentando enviar para: ${process.env.EXPO_PUBLIC_API_URL}/auth/login`); // Confirme a URL
      console.log(`[Login Mobile] Enviando email: ${email}`); // Evite conectar senha se possível

      // Chama a função da API tipada
      const loginResponse = await apiLogin(email, senha); // apiLogin vem de '../services/api'

      console.log('[Login Mobile] Resposta da API recebida:', loginResponse);

      // Verifica se a resposta contém os dados necessários
      if (!loginResponse || !loginResponse.user || !loginResponse.token) {
        throw new Error('Resposta de login inválida: dados incompletos');
      }

      // Verifica se o ID do usuário está presente na resposta
      if (!loginResponse.user.id) {
        console.error('[Login Mobile] ID do usuário ausente na resposta:', loginResponse);
        throw new Error('ID do usuário não encontrado na resposta');
      }

      // Verifica se o token está presente e não é vazio
      if (!loginResponse.token || loginResponse.token.trim() === '') {
        const errorMessage = 'Erro de validação: user.token: Required';
        console.error('[Login Mobile] Token ausente ou vazio na resposta:', errorMessage);
        Alert.alert('Erro no Login', errorMessage);
        return; // Encerra a função sem prosseguir
      }

      // Prepara o objeto User para o contexto (ajuste conforme sua interface User no AuthContext)
      const userForContext = {
        ...loginResponse.user,
        // Garante que token esteja presente no objeto user e não seja vazio
        token: loginResponse.token,
        // Garante que idUsuario esteja presente (o backend pode retornar id ou idUsuario)
        idUsuario: loginResponse.user.idUsuario || loginResponse.user.id || ''
      };

      // Log para diagnóstico do objeto de usuário e token
      console.log('[Login Mobile] Objeto de usuário criado:', {
        ...userForContext,
        token: userForContext.token ? `${userForContext.token.substring(0, 10)}...` : 'AUSENTE', // Mostra apenas parte do token por segurança
        temToken: !!userForContext.token,
        tokenLength: userForContext.token ? userForContext.token.length : 0
      });

      // Valida se os campos obrigatórios estão presentes (verificação extra de segurança)
      if (!userForContext.idUsuario && !userForContext.id) {
        const errorMessage = 'Erro de validação: user.idUsuario: Required';
        console.error('[Login Mobile] Validação falhou após construção do objeto de usuário:', errorMessage);
        Alert.alert('Erro no Login', errorMessage);
        return; // Encerra a função sem prosseguir
      }

      // Verifica se o token foi corretamente adicionado ao objeto de usuário
      if (!userForContext.token || userForContext.token.trim() === '') {
        const errorMessage = 'Erro de validação: user.token: Required';
        console.error('[Login Mobile] Token não foi adicionado corretamente ao objeto de usuário:', errorMessage);
        Alert.alert('Erro no Login', errorMessage);
        return; // Encerra a função sem prosseguir
      }

      console.log('[Login Mobile] Objeto de usuário validado com sucesso, prosseguindo com login');

      // Chama a função 'login' do AuthContext
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

      // Tenta extrair mais informações se disponíveis
      const errorResponse = error.response?.data;
      if (errorResponse) {
        console.error('Resposta de erro da API:', errorResponse);
      }

      console.error('--------------------------------------');

      // Determina a mensagem de erro a ser exibida para o usuário
      let userMessage = 'Ocorreu um erro desconhecido. Verifique os logs.';

      if (error instanceof Error) {
        // Usa a mensagem do erro, mas trata casos específicos
        if (error.message.includes('ID do usuário não encontrado')) {
          userMessage = 'Não foi possível obter seu ID de usuário. Por favor, tente novamente.';
        } else if (error.message.includes('dados incompletos')) {
          userMessage = 'A resposta do servidor está incompleta. Por favor, tente novamente mais tarde.';
        } else {
          userMessage = error.message;
        }
      }

      // Exibe o alerta para o usuário
      Alert.alert('Erro no Login', userMessage);
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
        disabled={isLoggingIn} // Desabilita botão durante o 'login'
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
    fontSize: 16, // Tamanho da fonte do 'input'
  },
  linkContainer: {
    marginTop: 20, // Adiciona espaço acima da conexão de cadastro
  },
});
