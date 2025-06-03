import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';

// 1. Importar a função da API (renomeada) e tipos necessários
// Importa a função de registro da API e a renomeia para apiRegister para evitar conflitos de nomes
import { register as apiRegister } from '../services/api';
// Importa o tipo RegistrationData que define a estrutura dos dados de cadastro
import { RegistrationData } from "@/types/api";
// Importa o enum que define os tipos de usuário disponíveis no sistema
import { TipoUsuarioEnum } from "@/types/user";

// Importar tipos de navegação e TipoUsuarioEnum
// Importa o tipo NativeStackScreenProps para tipar as propriedades de navegação
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// Importa o tipo RootStackParamList que define todas as rotas disponíveis na navegação
import { RootStackParamList} from "@/navigation/types";

// Nota: Os tipos de usuário foram unificados, agora usando flags booleanas
// (isComprador, isPrestador, isAnunciante) em vez de enum values.
// Apenas TipoUsuarioEnum.ADMIN permanece como um tipo específico.

// RootStackParamList é importado de @/navigation/types
// Tipo das props para RegistrationScreen
type RegistrationScreenProps = NativeStackScreenProps<RootStackParamList, 'Registration'>;

/**
 * Tela de cadastro de usuário.
 * Coleta informações necessárias e envia para o endpoint /api/auth/register.
 */
export default function RegistrationScreen({ navigation }: RegistrationScreenProps) {
  // 2. Tipar estados locais
  // Estado para armazenar o nome do usuário
  const [nome, setNome] = useState<string>('');
  // Estado para armazenar o email do usuário
  const [email, setEmail] = useState<string>('');
  // Estado para armazenar a senha do usuário
  const [senha, setSenha] = useState<string>('');
  // Estado para armazenar o telefone do usuário
  const [telefone, setTelefone] = useState<string>('');
  // Estado para armazenar o CPF ou CNPJ do usuário
  const [cpfCnpj, setCpfCnpj] = useState<string>('');
  // O tipo de usuário agora é unificado, usamos apenas flags de capacidade
  // Definimos todas as flags de capacidade como true para o tipo de usuário unificado
  const isComprador = true;
  const isPrestador = true;
  const isAnunciante = true;
  const isAdmin = false; // Usuários comuns não são administradores
  // Estado para armazenar o endereço do usuário
  const [endereco, setEndereco] = useState<string>('');
  // Estado para armazenar a data de nascimento do usuário, com valor padrão de 1 de janeiro de 2000
  const [dataNascimento, setDataNascimento] = useState<Date>(new Date(2000, 0, 1)); // Data padrão: 1 de janeiro de 2000
  // Estado para controlar a visibilidade do seletor de data
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  // Estado para armazenar o gênero selecionado pelo usuário, com valor padrão "Prefiro não dizer"
  const [genero, setGenero] = useState<string>('Prefiro não dizer'); // valor padrão
  // Estado para controlar a visibilidade do seletor de gênero
  const [showGenderPicker, setShowGenderPicker] = useState<boolean>(false);
  // Estado para controlar a exibição do indicador de carregamento durante o processo de cadastro
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Estado para controlar se os termos de uso foram aceitos pelo usuário
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false); // Estado para o checkbox de termos

  // 3. Refatorar handleRegister
  // Função assíncrona que gerencia o processo de cadastro do usuário
  const handleRegister = async () => {
    // Validação simples dos campos obrigatórios
    // Verifica se os campos essenciais foram preenchidos
    if (!nome || !email || !senha || !cpfCnpj) {
      Alert.alert('Erro de Validação', 'Os campos Nome, Email, Senha e CPF/CNPJ são obrigatórios.');
      return;
    }

    // Validar aceitação dos termos
    // Verifica se o usuário aceitou os termos de uso e política de privacidade
    if (!termsAccepted) {
      Alert.alert('Erro de Validação', 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.');
      return;
    }

    // Ativa o indicador de carregamento
    setIsLoading(true);

    // Monta o objeto com os dados para a API
    // Cria um objeto com todos os dados do usuário para enviar à API de registro
    const registrationData: RegistrationData = {
      nome,
      email,
      senha,
      telefone: telefone || undefined, // Envia undefined se vazio
      cpfCnpj,
      // tipoUsuario removido, agora usamos apenas flags de capacidade
      isComprador, // Flag de capacidade para comprador
      isPrestador, // Flag de capacidade para prestador
      isAnunciante, // Flag de capacidade para anunciante
      isAdmin, // Flag para administrador (sempre false para registros normais)
      endereco: endereco || undefined, // Envia undefined se vazio
      dataNascimento: dataNascimento,  // Envia a data de nascimento
      genero: genero as 'Feminino' | 'Masculino' | 'Prefiro não dizer', // Envia o gênero
    };

    try {
      // Chama a função da API tipada
      // Envia os dados de registro para a API e aguarda a resposta
      const response = await apiRegister(registrationData);

      // Exibe mensagem de sucesso ao usuário
      Alert.alert('Sucesso', response.message);
      // Redireciona para a tela de login após o cadastro bem-sucedido
      navigation.navigate('Login'); // Redireciona para a tela de login

    } catch (error) {
      // Trata o erro lançado pela função da API (apiRegister)
      // Exibe uma mensagem de erro apropriada ao usuário
      Alert.alert(
        'Erro no Cadastro',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      // Desativa o indicador de carregamento independentemente do resultado
      setIsLoading(false);
    }
  };

  // A seleção de tipo de usuário foi removida, pois os tipos agora são unificados

  // Função para lidar com a seleção de gênero
  // Atualiza o estado do gênero com o valor selecionado e fecha o seletor
  const onGenderChange = (selectedGender: string) => {
    setShowGenderPicker(false);
    setGenero(selectedGender);
  };

  // Função para formatar a data para exibição
  // Converte o objeto Date para uma string no formato DD/MM/AAAA
  const formatDate = (date: Date): string => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Função para lidar com a mudança de data
  // Atualiza o estado da data de nascimento quando o usuário seleciona uma nova data
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

        {/* A seleção de tipo de usuário foi removida, pois os tipos agora são unificados */}

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
// Definição dos estilos utilizados no componente
const styles = StyleSheet.create({
  // Container principal que gerencia o comportamento do teclado
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  // Container do conteúdo dentro do ScrollView
  container: {
    flexGrow: 1, // Permite o ScrollView crescer
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40, // Adiciona espaço extra no final para garantir que todos os elementos sejam visíveis
  },
  // Estilo do título da página
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#2c3e50',
  },
  // Estilo dos campos de entrada de texto
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
  // Estilo das etiquetas de texto
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 5,
    color: '#34495e',
  },
  // Estilo do grupo de botões removido, pois a seleção de tipo de usuário não é mais necessária
  // Estilos para o seletor de gênero
  // Container que envolve as opções do seletor de gênero
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
  // Estilo para cada opção individual do seletor
  pickerOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  // Estilo aplicado à opção selecionada
  pickerOptionSelected: {
    backgroundColor: '#e8f4fd',
  },
  // Estilo do texto das opções não selecionadas
  pickerOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  // Estilo do texto da opção selecionada
  pickerOptionTextSelected: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '500',
  },
  // Container que envolve a seção de termos e condições
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    marginTop: 15,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  // Estilo do checkbox para aceitar os termos
  checkbox: {
    marginRight: 10,
    marginTop: 2,
  },
  // Container do texto dos termos
  termsTextContainer: {
    flex: 1,
  },
  // Estilo do texto dos termos
  termsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  // Estilo dos links dentro do texto dos termos
  termsLink: {
    color: '#3498db',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  // Estilos para o botão de cadastro
  // Estilo principal do botão de cadastro
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
  // Estilo aplicado ao botão quando está desabilitado (durante o carregamento)
  registerButtonDisabled: {
    backgroundColor: '#7f8c8d',
    opacity: 0.8,
  },
  // Estilo do texto dentro do botão de cadastro
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Container que organiza o indicador de carregamento e o texto "Cadastrando..."
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
