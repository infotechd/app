import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity, // Para botões de tipo
  ListRenderItemInfo,
  RefreshControl
} from 'react-native';

// 1. Imports
import { useAuth } from '../context/AuthContext';
import {
  fetchPublicacoes as apiFetchPublicacoes,
  createPublicacao as apiCreatePublicacao
} from '../services/api';
import { Publicacao, PublicacaoData, PublicacaoType } from '../types/publicacao'; // Tipos de Publicacao
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// 2. Tipo das Props
type CommunityScreenProps = NativeStackScreenProps<RootStackParamList, 'Community'>;

/**
 * CommunityScreen – Tela de Comunidade
 * Permite criar publicações (posts/eventos) e visualizar as aprovadas.
 */
export default function CommunityScreen({ navigation }: CommunityScreenProps) {
  // 3. Obter usuário (para token ao criar)
  const { user } = useAuth();

  // 4. Tipar Estados
  const [conteudo, setConteudo] = useState<string>('');
  const [tipo, setTipo] = useState<PublicacaoType>('post'); // Usa o tipo PublicacaoType
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 5. Refatorar fetchPublicacoes
  const loadPublicacoes = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoadingList(true);
    setError(null);
    try {
      // Busca publicações (assume que retorna as aprovadas por padrão)
      const response = await apiFetchPublicacoes();
      setPublicacoes(response.publicacoes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar publicações';
      setError(msg);
      // Alert.alert('Erro', msg); // Alert pode ser irritante no refresh
    } finally {
      if (!isRefreshing) setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadPublicacoes();
  }, [loadPublicacoes]);

  // 6. Refatorar handleCreatePublicacao
  const handleCreatePublicacao = async () => {
    if (!user?.token) {
      Alert.alert('Erro', 'Você precisa estar logado para publicar.');
      return;
    }
    if (!conteudo.trim()) {
      Alert.alert('Erro', 'O conteúdo não pode estar vazio.');
      return;
    }
    // TODO: Adicionar campos para detalhes do evento se tipo === 'evento'

    setIsCreating(true);
    setError(null);

    const publicacaoData: PublicacaoData = {
      conteudo: conteudo.trim(),
      tipo: tipo,
      // detalhesEvento: tipo === 'evento' ? { /* dados do evento */ } : undefined
    };

    try {
      const response = await apiCreatePublicacao(user.token, publicacaoData);
      Alert.alert('Sucesso', response.message || 'Publicação criada!');
      setConteudo(''); // Limpa o campo
      // setTipo('post'); // Resetar tipo? Opcional
      loadPublicacoes(true); // Recarrega a lista para mostrar a nova publicação (se aprovada automaticamente)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao publicar';
      setError(msg);
      Alert.alert('Erro ao Publicar', msg);
    } finally {
      setIsCreating(false);
    }
  };

  // 7. Tipar renderItem e keyExtractor
  const renderItem = ({ item }: ListRenderItemInfo<Publicacao>): JSX.Element => (
    <View style={styles.itemContainer}>
      {/* Usar dados do autor se o backend retornar */}
      <Text style={styles.itemAuthor}>{item.autor?.nome || `Usuário (${item.autorId.substring(0, 6)}...)`}</Text>
      <Text style={styles.itemContent}>{item.conteudo}</Text>
      <View style={styles.itemFooter}>
        <Text style={styles.itemMeta}>Tipo: {item.tipo}</Text>
        <Text style={styles.itemMeta}>Em: {new Date(item.dataPostagem).toLocaleDateString('pt-BR')}</Text>
        {/* <Text style={styles.itemMeta}>Status: {item.status}</Text> */}
      </View>
      {/* TODO: Adicionar botões de Like, Comentar, etc. */}
    </View>
  );

  const keyExtractor = (item: Publicacao): string => item._id;

  // Componente para lista vazia
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text>Nenhuma publicação encontrada.</Text>
    </View>
  );

  // Função auxiliar para botões de tipo
  const renderTypeButton = (value: PublicacaoType, title: string) => (
    <TouchableOpacity
      style={[styles.typeButton, tipo === value ? styles.typeButtonSelected : {}]}
      onPress={() => setTipo(value)}
      disabled={isCreating}
    >
      <Text style={[styles.typeButtonText, tipo === value ? styles.typeButtonTextSelected : {}]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      {/* Usar ScrollView permite que o form e a lista rolem juntos */}
      <ScrollView
        style={styles.screenContainer}
        refreshControl={ // Pull to refresh para a lista
          <RefreshControl refreshing={loadingList} onRefresh={()=>loadPublicacoes(true)} />
        }
      >
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Nova Publicação</Text>
          <TextInput
            placeholder="Digite sua publicação..."
            value={conteudo}
            onChangeText={setConteudo}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
            editable={!isCreating}
          />
          {/* TODO: Adicionar inputs para detalhes do evento aqui, condicionalmente */}
          {/* Ex: if (tipo === 'evento') { ... inputs de data, local ... } */}

          <View style={styles.typeButtonGroup}>
            {renderTypeButton('post', 'Post')}
            {renderTypeButton('evento', 'Evento')}
          </View>

          <Button
            title={isCreating ? "Publicando..." : "Publicar"}
            onPress={handleCreatePublicacao}
            disabled={isCreating || loadingList}
          />
        </View>

        <View style={styles.listSectionContainer}>
          <Text style={styles.listTitle}>Feed da Comunidade</Text>
          {/* Exibe erro da lista, se houver */}
          {error && !loadingList && <Text style={styles.errorText}>{error}</Text>}
          {/* Exibe loading da lista apenas na carga inicial */}
          {loadingList && publicacoes.length === 0 && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }}/>}

          {/* FlatList para exibir publicações */}
          {/* Colocar FlatList dentro de ScrollView não é ideal para performance
               com muitos itens. Se a lista for grande, considere separar
               o formulário e a lista ou usar SectionList.
               Com scrollEnabled={false}, funciona para listas menores. */}
          {!loadingList && (
            <FlatList
              data={publicacoes}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListEmptyComponent={renderEmptyList}
              scrollEnabled={false} // Importante dentro de ScrollView
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 8. Estilos
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: { /* ... (similar aos anteriores) ... */ },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Alinha botões à esquerda
    marginVertical: 15,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15, // Mais arredondado
    marginRight: 10,
  },
  typeButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  typeButtonText: {
    color: '#555',
  },
  typeButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listSectionContainer: {
    padding: 20,
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  itemContainer: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd', // Borda mais visível
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8, // Bordas arredondadas
  },
  itemAuthor: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  itemContent: {
    fontSize: 15,
    lineHeight: 21,
    color: '#444',
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 5,
  },
  itemMeta: {
    fontSize: 12,
    color: '#777',
  },
  centerContainer: {
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 10,
    marginBottom: 10,
    color: 'red',
    textAlign: 'center',
  },
});