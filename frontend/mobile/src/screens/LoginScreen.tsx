import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';

// 1. Importar o hook useAuth e a função da API (renomeada)
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';

// Importar tipos de navegação e ParamList centralizados
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList} from '../navigation/types';

/*
// 3. Definir a lista de parâmetros para o Stack Navigator
//    (Idealmente, mova isso para um arquivo central de tipos de navegação)
type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Registration: undefined;
  ResetPassword?: undefined;
  Home: undefined;
  // Adicione outras telas e seus parâmetros aqui
};
*/
// 4. Definir o tipo das props para LoginScreen
type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Tela de login.
 * Coleta email e senha, chama a API de login e atualiza o AuthContext.
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

    try {
      // Chama a função da API tipada
      const loginResponse = await apiLogin(email, senha);

      // Prepara o objeto User para o contexto
      // A interface User em AuthContext deve corresponder a loginResponse.user
      // Se AuthContext espera o token dentro do objeto User, combine-os:
      const userForContext = {
        ...loginResponse.user,
        token: loginResponse.token // Garanta que o token está aqui se AuthContext.User o incluir
      };
      // Se AuthContext.User NÃO inclui token, passe apenas loginResponse.user

      // Chama a função login do AuthContext para atualizar o estado global
      await contextLogin(userForContext);

      // Alert.alert('Sucesso', 'Login realizado.'); // Opcional: Navegação implica sucesso

      // Navega para Home SEM passar parâmetros, pois o estado é global
      // A navegação pode ser gerenciada de forma diferente dependendo da sua config
      // (ex: um listener no AuthProvider que redireciona)
      // Mas a navegação direta após o login bem-sucedido é comum.
      // Se a navegação for gerenciada centralmente, esta linha pode ser removida.
      navigation.navigate('Home');

    } catch (error) {
      // Trata o erro lançado pela função da API (apiLogin)
      Alert.alert(
        'Erro no Login',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
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