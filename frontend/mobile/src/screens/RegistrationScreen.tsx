import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

// 1. Importar a função da API (renomeada) e tipos necessários
import { register as apiRegister } from '../services/api';
import { RegistrationData } from "@/types/api";
import { UserRole} from "@/types/user";

// Importar tipos de navegação e UserRole
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList} from "@/navigation/types";

// (Idealmente, importe de arquivos centrais de tipos)
/*
type UserRole = 'comprador' | 'prestador' | 'anunciante' | 'administrador';

type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Registration: undefined;
  ResetPassword?: undefined;
  Home: undefined;
  // Adicione outras telas e seus parâmetros aqui
};
*/
// Tipo das props para RegistrationScreen
type RegistrationScreenProps = NativeStackScreenProps<RootStackParamList, 'Registration'>;

/**
 * Tela de cadastro de usuário.
 * Coleta informações necessárias e envia para o endpoint /api/auth/register.
 */
export default function RegistrationScreen({ navigation }: RegistrationScreenProps) {
  // 2. Tipar estados locais
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [cpfCnpj, setCpfCnpj] = useState<string>('');
  const [tipoUsuario, setTipoUsuario] = useState<UserRole>('comprador'); // valor padrão
  const [endereco, setEndereco] = useState<string>('');
  const [foto, setFoto] = useState<string>(''); // URL da foto
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 3. Refatorar handleRegister
  const handleRegister = async () => {
    // Validação simples dos campos obrigatórios
    if (!nome || !email || !senha || !cpfCnpj) {
      Alert.alert('Erro de Validação', 'Os campos Nome, Email, Senha e CPF/CNPJ são obrigatórios.');
      return;
    }

    setIsLoading(true);

    // Monta o objeto com os dados para a API
    const registrationData: RegistrationData = {
      nome,
      email,
      senha,
      telefone: telefone || undefined, // Envia undefined se vazio
      cpfCnpj,
      tipoUsuario,
      endereco: endereco || undefined, // Envia undefined se vazio
      foto: foto || undefined,         // Envia undefined se vazio
    };

    try {
      // Chama a função da API tipada
      const response = await apiRegister(registrationData);

      Alert.alert('Sucesso', response.message);
      navigation.navigate('Login'); // Redireciona para a tela de login

    } catch (error) {
      // Trata o erro lançado pela função da API (apiRegister)
      Alert.alert(
        'Erro no Cadastro',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para botões de tipo de usuário
  const renderTypeButton = (role: UserRole, title: string) => (
    <Button
      title={title}
      onPress={() => setTipoUsuario(role)}
      color={tipoUsuario === role ? '#3498db' : '#bdc3c7'} // Destaca o botão selecionado
      disabled={isLoading}
    />
  );


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Cadastro</Text>

        <TextInput
          placeholder="Nome *"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
          editable={!isLoading}
        />
        <TextInput
          placeholder="Email *"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          editable={!isLoading}
        />
        <TextInput
          placeholder="Senha *"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          style={styles.input}
          editable={!isLoading}
        />
        <TextInput
          placeholder="Telefone"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          style={styles.input}
          editable={!isLoading}
        />
        <TextInput
          placeholder="CPF/CNPJ *"
          value={cpfCnpj}
          onChangeText={setCpfCnpj}
          style={styles.input}
          editable={!isLoading}
          // Poderia adicionar máscara aqui
        />
        <TextInput
          placeholder="Endereço"
          value={endereco}
          onChangeText={setEndereco}
          style={styles.input}
          editable={!isLoading}
        />
        <TextInput
          placeholder="URL da Foto de Perfil"
          value={foto}
          onChangeText={setFoto}
          style={styles.input}
          editable={!isLoading}
        />

        <Text style={styles.label}>Tipo de Usuário *</Text>
        <View style={styles.buttonGroup}>
          {renderTypeButton('comprador', 'Comprador')}
          {renderTypeButton('prestador', 'Prestador')}
          {renderTypeButton('anunciante', 'Anunciante')}
        </View>

        <Button
          title={isLoading ? "Cadastrando..." : "Cadastrar"}
          onPress={handleRegister}
          disabled={isLoading}
          color="#27ae60" // Cor verde para cadastro
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos (melhorados e similares aos de LoginScreen)
const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1, // Permite o ScrollView crescer
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 5,
    color: '#555',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    marginTop: 5,
  },
});