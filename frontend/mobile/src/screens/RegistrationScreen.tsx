import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';

// 1. Importar a função da API (renomeada) e tipos necessários
import { register as apiRegister } from '../services/api';
import { RegistrationData } from "@/types/api";
import { TipoUsuarioEnum } from "@/types/user";

// Importar tipos de navegação e TipoUsuarioEnum
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList} from "@/navigation/types";

// (Idealmente, importe de arquivos centrais de tipos)
/*
enum TipoUsuarioEnum {
  COMPRADOR = 'comprador',
  PRESTADOR = 'prestador',
  ANUNCIANTE = 'anunciante',
  ADMIN = 'admin'
}

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
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuarioEnum>(TipoUsuarioEnum.COMPRADOR); // valor padrão
  const [endereco, setEndereco] = useState<string>('');
  const [dataNascimento, setDataNascimento] = useState<Date>(new Date(2000, 0, 1)); // Data padrão: 1 de janeiro de 2000
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [genero, setGenero] = useState<string>('Prefiro não dizer'); // valor padrão
  const [showGenderPicker, setShowGenderPicker] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false); // Estado para o checkbox de termos

  // 3. Refatorar handleRegister
  const handleRegister = async () => {
    // Validação simples dos campos obrigatórios
    if (!nome || !email || !senha || !cpfCnpj) {
      Alert.alert('Erro de Validação', 'Os campos Nome, Email, Senha e CPF/CNPJ são obrigatórios.');
      return;
    }

    // Validar aceitação dos termos
    if (!termsAccepted) {
      Alert.alert('Erro de Validação', 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.');
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
      dataNascimento: dataNascimento,  // Envia a data de nascimento
      genero: genero as 'Feminino' | 'Masculino' | 'Prefiro não dizer', // Envia o gênero
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
  const renderTypeButton = (role: TipoUsuarioEnum, title: string) => (
    <Button
      title={title}
      onPress={() => setTipoUsuario(role)}
      color={tipoUsuario === role ? '#3498db' : '#bdc3c7'} // Destaca o botão selecionado
      disabled={isLoading}
    />
  );

  // Função para lidar com a seleção de gênero
  const onGenderChange = (selectedGender: string) => {
    setShowGenderPicker(false);
    setGenero(selectedGender);
  };

  // Função para formatar a data para exibição
  const formatDate = (date: Date): string => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Função para lidar com a mudança de data
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDataNascimento(selectedDate);
    }
  };


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

        {/* Campo Data de Nascimento */}
        <Text style={styles.label}>Data de Nascimento</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
          disabled={isLoading}
        >
          <Text>{formatDate(dataNascimento)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dataNascimento}
            mode="date"
            display="spinner"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Campo Gênero */}
        <Text style={styles.label}>Gênero</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowGenderPicker(true)}
          disabled={isLoading}
        >
          <Text>{genero}</Text>
        </TouchableOpacity>

        {showGenderPicker && (
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={[styles.pickerOption, genero === 'Feminino' ? styles.pickerOptionSelected : null]}
              onPress={() => onGenderChange('Feminino')}
            >
              <Text style={genero === 'Feminino' ? styles.pickerOptionTextSelected : styles.pickerOptionText}>Feminino</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerOption, genero === 'Masculino' ? styles.pickerOptionSelected : null]}
              onPress={() => onGenderChange('Masculino')}
            >
              <Text style={genero === 'Masculino' ? styles.pickerOptionTextSelected : styles.pickerOptionText}>Masculino</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerOption, genero === 'Prefiro não dizer' ? styles.pickerOptionSelected : null]}
              onPress={() => onGenderChange('Prefiro não dizer')}
            >
              <Text style={genero === 'Prefiro não dizer' ? styles.pickerOptionTextSelected : styles.pickerOptionText}>Prefiro não dizer</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Tipo de Usuário *</Text>
        <View style={styles.buttonGroup}>
          {renderTypeButton(TipoUsuarioEnum.COMPRADOR, 'Comprador')}
          {renderTypeButton(TipoUsuarioEnum.PRESTADOR, 'Prestador')}
          {renderTypeButton(TipoUsuarioEnum.ANUNCIANTE, 'Anunciante')}
        </View>

        {/* Checkbox para aceitar os termos */}
        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => setTermsAccepted(!termsAccepted)}
            disabled={isLoading}
          >
            <MaterialIcons 
              name={termsAccepted ? "check-box" : "check-box-outline-blank"} 
              size={24} 
              color={termsAccepted ? "#27ae60" : "#999"} 
            />
          </TouchableOpacity>
          <View style={styles.termsTextContainer}>
            <Text style={styles.termsText}>
              Ao concordar, você aceita os 
              <Text 
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://example.com/termos-de-uso')}
              > Termos de Uso </Text> 
              e a nova 
              <Text 
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://example.com/politica-de-privacidade')}
              > Política de Privacidade</Text>
              , que são obrigatórios para continuar utilizando nossos serviços.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.registerButtonText}>Cadastrando...</Text>
              <ActivityIndicator size="small" color="#ffffff" style={{ marginLeft: 10 }} />
            </View>
          ) : (
            <Text style={styles.registerButtonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos (modernizados e melhorados)
const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    flexGrow: 1, // Permite o ScrollView crescer
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40, // Adiciona espaço extra no final para garantir que todos os elementos sejam visíveis
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 5,
    color: '#34495e',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    marginTop: 5,
  },
  // Estilos para o picker de gênero
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionSelected: {
    backgroundColor: '#e8f4fd',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  pickerOptionTextSelected: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    marginTop: 15,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  checkbox: {
    marginRight: 10,
    marginTop: 2,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  termsLink: {
    color: '#3498db',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  // Estilos para o botão de cadastro
  registerButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonDisabled: {
    backgroundColor: '#7f8c8d',
    opacity: 0.8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
