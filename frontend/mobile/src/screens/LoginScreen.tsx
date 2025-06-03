import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';

// 1. Importar o hook useAuth e a função da API (renomeada)
// Importa o hook de autenticação do contexto e a função de login da API
import { useAuth } from "@/context/AuthContext";
import { login as apiLogin } from '../services/api';

// Importar tipos de navegação e ParamList centralizados
// Importa os tipos necessários para a navegação entre telas
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList} from "@/navigation/types";


// 4. Definir o tipo das props para LoginScreen
// Define o tipo de propriedades que a tela de login recebe, incluindo as propriedades de navegação
type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Tela de 'login'.
 * Coleta endereço eletrônico e senha, chama a API de 'login' e atualiza o AuthContext.
 * Esta tela é responsável pela autenticação do usuário no sistema.
 */
export default function LoginScreen({ navigation }: LoginScreenProps) {
  // 5. Tipar o estado local
  // Estados para armazenar os dados do formulário de login
  const [email, setEmail] = useState<string>(''); // Estado para armazenar o email do usuário
  const [senha, setSenha] = useState<string>(''); // Estado para armazenar a senha do usuário
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false); // Estado para feedback de carregamento durante o processo de login

  // 6. Obter a função de 'login' do contexto
  // Extrai a função de login do contexto de autenticação para uso posterior
  const { login: contextLogin } = useAuth();

  // 7. Refatorar handleLogin
  // Função assíncrona que gerencia o processo de login
  const handleLogin = async () => {
    // Validação mais completa no frontend antes de enviar para a API
    // Verifica se o campo de email está preenchido
    if (!email) {
      Alert.alert('Erro', 'O email é obrigatório.');
      return;
    }

    // Validar formato de email
    // Utiliza expressão regular para verificar se o email está em um formato válido
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, insira um endereço de email válido.');
      return;
    }

    // Verifica se o campo de senha está preenchido
    if (!senha) {
      Alert.alert('Erro', 'A senha é obrigatória.');
      return;
    }

    // Validar requisitos de senha
    // Verifica se a senha tem o comprimento mínimo necessário
    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // Verificar se a senha contém pelo menos uma letra maiúscula, uma minúscula e um número
    // Utiliza expressão regular para validar a complexidade da senha
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!senhaRegex.test(senha)) {
      Alert.alert('Erro', 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.');
      return;
    }

    setIsLoggingIn(true); // Ativa o indicador de carregamento para feedback visual ao usuário
    // Dentro da função handleLogin em LoginScreen.tsx

    // Declarar loginResponse fora do bloco try para que esteja disponível no catch
    // Isso permite acessar a resposta mesmo em caso de erro
    let loginResponse: any = null;

    try {
      // Logs para depuração da chamada à API
      console.log(`[Login Mobile] Tentando enviar para: ${process.env.EXPO_PUBLIC_API_URL}/auth/login`); // Confirma a URL da API
      console.log(`[Login Mobile] Enviando email: ${email}`); // Registra o email sem expor a senha por questões de segurança

      // Chama a função da API tipada
      // Envia as credenciais para o servidor e aguarda a resposta
      loginResponse = await apiLogin(email, senha); // apiLogin vem de '../services/api'

      // Registra a resposta recebida para depuração
      console.log('[Login Mobile] Resposta da API recebida:', loginResponse);

      // Verifica se a resposta contém os dados necessários
      // Validação inicial para garantir que a resposta da API contém todos os campos obrigatórios
      if (!loginResponse || !loginResponse.user || !loginResponse.token) {
        throw new Error('Resposta de login inválida: dados incompletos');
      }

      // Verifica se o ID do usuário está presente na resposta
      // O ID é essencial para identificar o usuário no sistema
      if (!loginResponse.user.id) {
        console.error('[Login Mobile] ID do usuário ausente na resposta:', loginResponse);
        throw new Error('ID do usuário não encontrado na resposta');
      }

      // Verifica se o token está presente e não é vazio
      // O token é necessário para autenticar requisições futuras
      if (!loginResponse.token || loginResponse.token.trim() === '') {
        const errorMessage = 'Erro de validação: user.token: Required';
        console.error('[Login Mobile] Token ausente ou vazio na resposta:', errorMessage);
        Alert.alert('Erro no Login', errorMessage);
        return; // Encerra a função sem prosseguir
      }

      // Prepara o objeto User para o contexto (ajuste conforme sua interface User no AuthContext)
      // Cria um objeto de usuário completo com todas as propriedades necessárias
      const userForContext = {
        ...loginResponse.user,
        // Garante que token esteja presente no objeto user e não seja vazio
        // O token será usado para autenticar requisições à API
        token: loginResponse.token,
        // Garante que idUsuario esteja presente (o backend pode retornar id ou idUsuario)
        // Compatibilidade com diferentes formatos de resposta da API
        idUsuario: loginResponse.user.idUsuario || loginResponse.user.id || '',
        // Garante que as flags de capacidade estejam presentes
        // Estas flags determinam as permissões e funcionalidades disponíveis para o usuário
        isComprador: loginResponse.user.isComprador ?? false,
        isPrestador: loginResponse.user.isPrestador ?? false,
        isAnunciante: loginResponse.user.isAnunciante ?? false,
        isAdmin: loginResponse.user.isAdmin ?? false
      };

      // Log para diagnóstico do objeto de usuário e token
      // Registra informações sobre o objeto de usuário criado, ocultando parte do token por segurança
      console.log('[Login Mobile] Objeto de usuário criado:', {
        ...userForContext,
        token: userForContext.token ? `${userForContext.token.substring(0, 10)}...` : 'AUSENTE', // Mostra apenas parte do token por segurança
        temToken: !!userForContext.token,
        tokenLength: userForContext.token ? userForContext.token.length : 0,
        isComprador: userForContext.isComprador,
        isPrestador: userForContext.isPrestador,
        isAnunciante: userForContext.isAnunciante,
        isAdmin: userForContext.isAdmin
      });

      // Valida se os campos obrigatórios estão presentes (verificação extra de segurança)
      // Verifica se o ID do usuário está presente em pelo menos um dos campos esperados
      if (!userForContext.idUsuario && !userForContext.id) {
        const errorMessage = 'Erro de validação: user.idUsuario: Required';
        console.error('[Login Mobile] Validação falhou após construção do objeto de usuário:', errorMessage);
        Alert.alert('Erro no Login', errorMessage);
        return; // Encerra a função sem prosseguir
      }

      // Verifica se o token foi corretamente adicionado ao objeto de usuário
      // Garantia adicional de que o token está presente e não está vazio
      if (!userForContext.token || userForContext.token.trim() === '') {
        const errorMessage = 'Erro de validação: user.token: Required';
        console.error('[Login Mobile] Token não foi adicionado corretamente ao objeto de usuário:', errorMessage);
        Alert.alert('Erro no Login', errorMessage);
        return; // Encerra a função sem prosseguir
      }

      // Verifica se pelo menos uma das flags de capacidade está ativa
      // As capacidades determinam quais funcionalidades o usuário pode acessar
      if (!userForContext.isComprador && !userForContext.isPrestador && !userForContext.isAnunciante && !userForContext.isAdmin) {
        // Se o usuário não tem nenhuma capacidade definida, definimos isPrestador como true
        // baseado no email que contém "prestador"
        console.log('[Login Mobile] Nenhuma capacidade de usuário foi definida. Definindo isPrestador como true.');
        userForContext.isPrestador = true;
      }

      // Confirmação de que todas as validações foram bem-sucedidas
      console.log('[Login Mobile] Objeto de usuário validado com sucesso, prosseguindo com login');

      // Chama a função 'login' do AuthContext
      // Atualiza o contexto de autenticação com os dados do usuário logado
      await contextLogin(userForContext);

      // Confirmação de que o contexto foi atualizado e navegação para a tela inicial
      console.log('[Login Mobile] Contexto atualizado. Navegando para Home...');
      navigation.navigate('Home');

    } catch (error: any) { // Captura qualquer tipo de erro durante o processo de login
      console.error('--- ERRO DETALHADO NO LOGIN MOBILE ---');

      // Loga diferentes propriedades do erro que podem existir
      // Registra informações detalhadas sobre o erro para facilitar a depuração
      if (error instanceof Error) {
        console.error('Mensagem de Erro:', error.message);
        console.error('Nome do Erro:', error.name);
        console.error('Stack Trace:', error.stack);

        // Verifica se o erro está relacionado às capacidades do usuário
        // Identifica problemas específicos relacionados às permissões do usuário
        if (error.message.includes('capacidade') || error.message.includes('isComprador') || 
            error.message.includes('isPrestador') || error.message.includes('isAnunciante')) {
          console.error('ERRO RELACIONADO ÀS CAPACIDADES DO USUÁRIO DETECTADO!');
          console.error('Detalhes do loginResponse (se disponível):', 
            loginResponse && loginResponse.user ? {
              'user.isComprador': loginResponse.user.isComprador ?? 'AUSENTE',
              'user.isPrestador': loginResponse.user.isPrestador ?? 'AUSENTE',
              'user.isAnunciante': loginResponse.user.isAnunciante ?? 'AUSENTE',
              'user.isAdmin': loginResponse.user.isAdmin ?? 'AUSENTE',
              'user.id': loginResponse.user.id || loginResponse.user.idUsuario || 'AUSENTE'
            } : 'loginResponse ou loginResponse.user indisponível');
        }
      } else {
        // Se não for um objeto Error padrão
        // Registra o objeto de erro completo para análise
        console.error('Objeto de Erro Completo:', error);
      }

      // Tenta extrair mais informações se disponíveis
      // Busca dados adicionais da resposta de erro da API
      const errorResponse = error.response?.data;
      if (errorResponse) {
        console.error('Resposta de erro da API:', errorResponse);
      }

      console.error('--------------------------------------');

      // Determina a mensagem de erro a ser exibida para o usuário
      // Prepara uma mensagem amigável para mostrar ao usuário
      let userMessage = 'Ocorreu um erro desconhecido. Verifique os logs.';

      if (error instanceof Error) {
        // Usa a mensagem do erro, mas trata casos específicos
        // Personaliza a mensagem de erro com base no tipo de problema encontrado
        if (error.message.includes('ID do usuário não encontrado')) {
          userMessage = 'Não foi possível obter seu ID de usuário. Por favor, tente novamente.';
        } else if (error.message.includes('dados incompletos')) {
          userMessage = 'A resposta do servidor está incompleta. Por favor, tente novamente mais tarde.';
        } else {
          userMessage = error.message;
        }
      }

      // Exibe o alerta para o usuário
      // Mostra uma mensagem de erro amigável na interface
      Alert.alert('Erro no Login', userMessage);
    } finally {
      setIsLoggingIn(false); // Desativa o indicador de carregamento quando o processo termina (com sucesso ou erro)
    }

  };

  // Renderização do componente de login
  // Retorna a interface visual da tela de login
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {/* Campo de entrada para o email do usuário */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        editable={!isLoggingIn} // Desabilita input durante o login para evitar múltiplas submissões
      />
      {/* Campo de entrada para a senha do usuário (com texto oculto) */}
      <TextInput
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        style={styles.input}
        editable={!isLoggingIn} // Desabilita input durante o login para evitar múltiplas submissões
      />
      {/* Botão de login que muda o texto conforme o estado de carregamento */}
      <Button
        title={isLoggingIn ? "Entrando..." : "Entrar"}
        onPress={handleLogin}
        disabled={isLoggingIn} // Desabilita botão durante o login para evitar múltiplas submissões
      />
      {/* Botão para ir para a tela de cadastro */}
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

// Estilos básicos para a interface da tela de login
// Define a aparência visual dos componentes
const styles = StyleSheet.create({
  container: {
    flex: 1, // Faz o container ocupar a tela toda
    justifyContent: 'center', // Centraliza o conteúdo verticalmente
    padding: 20, // Adiciona espaçamento interno em todos os lados
  },
  title: {
    fontSize: 24, // Aumenta o tamanho do título
    fontWeight: 'bold', // Deixa o título em negrito
    marginBottom: 20, // Aumenta o espaço abaixo do título
    textAlign: 'center', // Centraliza o título horizontalmente
  },
  input: {
    borderWidth: 1, // Adiciona borda completa ao redor do campo
    borderColor: '#ccc', // Define a cor da borda como cinza claro
    borderRadius: 5, // Adiciona bordas arredondadas aos campos
    padding: 10, // Adiciona espaçamento interno dentro dos campos
    marginBottom: 15, // Aumenta o espaço abaixo de cada campo de entrada
    fontSize: 16, // Define o tamanho da fonte do texto dentro dos campos
  },
  linkContainer: {
    marginTop: 20, // Adiciona espaço acima do botão de cadastro
  },
});
