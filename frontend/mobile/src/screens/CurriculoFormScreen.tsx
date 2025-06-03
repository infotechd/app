import React, { useState } from 'react'; // Adicionado useEffect se for buscar dados (Added useEffect if fetching data)
import {
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

// 1. Importações (Imports)
/**
 * Esta seção contém todas as importações necessárias para o funcionamento do componente:
 * - Contexto de autenticação para obter o usuário logado
 * - Funções da API para salvar e buscar dados do currículo
 * - Tipos de dados para o currículo
 */
import { useAuth } from "@/context/AuthContext";
import { saveCurriculo as apiSaveCurriculo } from '../services/api'; // Importar API (Import API)
// import { getMyCurriculo as apiGetMyCurriculo } from '../services/api'; // Descomentar se for buscar (Uncomment if fetching)
import { CurriculoData } from "@/types/curriculo"; // Importar tipo (Import type)
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props (Props Type)
/**
 * Define o tipo das propriedades recebidas pelo componente.
 * Utiliza o tipo NativeStackScreenProps para obter as propriedades de navegação.
 */
type CurriculoFormScreenProps = NativeStackScreenProps<RootStackParamList, 'CurriculoForm'>;

/**
 * Tela para cadastrar ou editar o currículo do prestador.
 * Exige que o usuário seja 'prestador' e esteja autenticado.
 * 
 * (Screen for registering or editing the service provider's resume.
 * Requires the user to be a 'provider' and be authenticated.)
 */
export default function CurriculoFormScreen({ navigation }: CurriculoFormScreenProps) {
  // 3. Obter usuário/token (Get user/token)
  /**
   * Obtém o objeto de usuário do contexto de autenticação.
   * Este objeto contém informações do usuário logado, incluindo o token de autenticação.
   */
  const { user } = useAuth();

  // 4. Tipar Estados Locais (Type Local States)
  /**
   * Define os estados locais do componente com suas respectivas tipagens:
   * - experiencia: armazena a experiência profissional do usuário
   * - habilidades: armazena as habilidades técnicas e interpessoais
   * - projetos: armazena informações sobre projetos e portfólio
   * - isLoading: controla o estado de carregamento durante o salvamento
   */
  const [experiencia, setExperiencia] = useState<string>('');
  const [habilidades, setHabilidades] = useState<string>('');
  const [projetos, setProjetos] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [isFetching, setIsFetching] = useState<boolean>(true); // Se buscar dados iniciais (If fetching initial data)

  // --- Opcional: Buscar dados existentes ao carregar (Optional: Fetch existing data on load) ---
  /**
   * Este bloco de código está comentado, mas pode ser ativado para buscar dados existentes do currículo.
   * Quando ativado, ele:
   * 1. Executa uma vez quando o componente é montado ou quando o token do usuário muda
   * 2. Busca os dados do currículo do usuário da API
   * 3. Preenche os campos do formulário com os dados obtidos
   * 4. Trata erros caso a busca falhe
   */
  /*
  useEffect(() => {
    const fetchCurriculoData = async () => {
      if (!user?.token) return;
      setIsFetching(true);
      try {
        const response = await apiGetMyCurriculo(user.token);
        if (response.curriculo) {
          setExperiencia(response.curriculo.experiencia || '');
          setHabilidades(response.curriculo.habilidades || '');
          setProjetos(response.curriculo.projetos || '');
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar dados do currículo existente.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchCurriculoData();
  }, [user?.token]);
  */
  // ----------------------------------------------------

  // 5. Função de Salvamento (Save Function)
  /**
   * Função responsável por salvar os dados do currículo.
   * Processo:
   * 1. Verifica se o usuário está autenticado
   * 2. Valida se pelo menos um campo foi preenchido
   * 3. Prepara os dados para envio à API
   * 4. Envia os dados e trata a resposta
   * 5. Exibe mensagem de sucesso ou erro
   */
  const handleSave = async () => {
    if (!user?.token) {
      Alert.alert('Erro', 'Autenticação necessária.');
      return;
    }
    // Validação básica (pode adicionar mais) (Basic validation - can add more)
    if (!experiencia.trim() && !habilidades.trim() && !projetos.trim()) {
      Alert.alert('Aviso', 'Preencha pelo menos um campo do currículo.');
      return;
    }

    setIsLoading(true);

    const curriculoData: CurriculoData = {
      experiencia: experiencia.trim(),
      habilidades: habilidades.trim(),
      projetos: projetos.trim(),
    };

    try {
      const response = await apiSaveCurriculo(user.token, curriculoData);
      Alert.alert('Sucesso', response.message);
      navigation.goBack(); // Volta para a tela anterior (Returns to previous screen)

    } catch (error) {
      Alert.alert(
        'Erro ao Salvar',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Renderização condicional durante carregamento (Conditional rendering during loading)
  /**
   * Este bloco de código está comentado, mas pode ser ativado junto com o useEffect.
   * Quando ativado, ele:
   * 1. Verifica se os dados estão sendo buscados da API
   * 2. Exibe um indicador de carregamento enquanto os dados são obtidos
   * 3. Impede a renderização do formulário até que os dados estejam disponíveis
   */
  /*
  if (isFetching) {
     return (
       <View style={styles.container}>
         <ActivityIndicator size="large" />
         <Text>Carregando...</Text>
       </View>
     )
  }
  */

  // Renderização do componente (Component rendering)
  /**
   * Renderiza a interface do usuário do formulário de currículo.
   * Estrutura:
   * 1. KeyboardAvoidingView: ajusta a tela quando o teclado é exibido
   * 2. ScrollView: permite rolagem quando o conteúdo é maior que a tela
   * 3. Campos de texto para experiência, habilidades e projetos
   * 4. Botão de salvar ou indicador de carregamento
   */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Meu Currículo</Text>

        <Text style={styles.label}>Experiência</Text>
        <TextInput
          placeholder="Descreva suas experiências profissionais relevantes..."
          value={experiencia}
          onChangeText={setExperiencia}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={5}
          editable={!isLoading}
        />

        <Text style={styles.label}>Habilidades</Text>
        <TextInput
          placeholder="Liste suas principais habilidades técnicas e interpessoais..."
          value={habilidades}
          onChangeText={setHabilidades}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          editable={!isLoading}
        />

        <Text style={styles.label}>Projetos/Portfólio</Text>
        <TextInput
          placeholder="Descreva projetos notáveis ou links para seu portfólio..."
          value={projetos}
          onChangeText={setProjetos}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          editable={!isLoading}
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" style={{marginTop: 20}} />
        ) : (
          <Button title="Salvar Currículo" onPress={handleSave} disabled={isLoading} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 6. Estilos (Styles)
/**
 * Define os estilos utilizados no componente.
 * Estilos principais:
 * - container: estilo do contêiner principal
 * - title: estilo do título do formulário
 * - label: estilo dos rótulos dos campos
 * - input: estilo base para campos de entrada
 * - textArea: estilo específico para áreas de texto
 */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    // justifyContent: 'center', // Remover para formulário longo (Remove for long form)
  },
  title: {
    fontSize: 20, // Ajustado (Adjusted)
    fontWeight: 'bold',
    marginBottom: 20, // Mais espaço (More space)
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 5,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 15, // Ajustado (Adjusted)
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100, // Altura mínima (Minimum height)
    textAlignVertical: 'top',
  },
});
