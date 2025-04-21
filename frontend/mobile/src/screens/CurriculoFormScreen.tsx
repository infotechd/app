import React, { useState, useEffect } from 'react'; // Adicionado useEffect se for buscar dados
import {
  View,
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

// 1. Imports
import { useAuth } from '../context/AuthContext';
import { saveCurriculo as apiSaveCurriculo } from '../services/api'; // Importar API
// import { getMyCurriculo as apiGetMyCurriculo } from '../services/api'; // Descomentar se for buscar
import { CurriculoData } from '../types/curriculo'; // Importar tipo
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// 2. Tipo das Props
type CurriculoFormScreenProps = NativeStackScreenProps<RootStackParamList, 'CurriculoForm'>;

/**
 * Tela para cadastrar ou editar o currículo do prestador.
 * Exige que o usuário seja 'prestador' e esteja autenticado.
 */
export default function CurriculoFormScreen({ navigation }: CurriculoFormScreenProps) {
  // 3. Obter usuário/token
  const { user } = useAuth();

  // 4. Tipar Estados Locais
  const [experiencia, setExperiencia] = useState<string>('');
  const [habilidades, setHabilidades] = useState<string>('');
  const [projetos, setProjetos] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [isFetching, setIsFetching] = useState<boolean>(true); // Se buscar dados iniciais

  // --- Opcional: Buscar dados existentes ao carregar ---
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

  // 5. Refatorar handleSave
  const handleSave = async () => {
    if (!user?.token) {
      Alert.alert('Erro', 'Autenticação necessária.');
      return;
    }
    // Validação básica (pode adicionar mais)
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
      navigation.goBack(); // Volta para a tela anterior

    } catch (error) {
      Alert.alert(
        'Erro ao Salvar',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Se estiver buscando dados iniciais
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

// 6. Estilos
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    // justifyContent: 'center', // Remover para formulário longo
  },
  title: {
    fontSize: 20, // Ajustado
    fontWeight: 'bold',
    marginBottom: 20, // Mais espaço
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
    fontSize: 15, // Ajustado
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100, // Altura mínima
    textAlignVertical: 'top',
  },
});