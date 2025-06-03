import React, { useState, useEffect, useCallback } from 'react';
import * as ReactJSX from 'react';
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
  TouchableOpacity, // Para botões de tipo de publicação
  ListRenderItemInfo,
  RefreshControl
} from 'react-native';

// 1. Importações de contextos, serviços e tipos necessários
import { useAuth } from "@/context/AuthContext";
import {
  fetchPublicacoes as apiFetchPublicacoes,
  createPublicacao as apiCreatePublicacao
} from '../services/api';
import { Publicacao, PublicacaoData, PublicacaoType } from "@/types/publicacao"; // Importação dos tipos relacionados às publicações
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Definição do tipo das propriedades do componente
type CommunityScreenProps = NativeStackScreenProps<RootStackParamList, 'Community'>;

/**
 * CommunityScreen – Tela de Comunidade
 * 
 * Este componente implementa a tela de comunidade do aplicativo, que oferece duas funcionalidades principais:
 * 1. Criação de publicações (posts ou eventos) pelos usuários logados
 * 2. Visualização das publicações aprovadas em formato de feed
 * 
 * A tela possui um formulário na parte superior para criação de conteúdo e uma lista
 * rolável de publicações existentes na parte inferior.
 */
export default function CommunityScreen({ }: CommunityScreenProps) {
  // 3. Obtenção do usuário atual do contexto de autenticação (necessário para o token ao criar publicações)
  const { user } = useAuth();

  // 4. Definição dos estados com tipagem adequada
  const [conteudo, setConteudo] = useState<string>('');
  const [tipo, setTipo] = useState<PublicacaoType>('post'); // Define o tipo inicial como 'post' usando o tipo PublicacaoType
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 5. Função para carregar publicações da API com tratamento de estados
  const loadPublicacoes = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoadingList(true);
    setError(null);
    try {
      // Busca publicações da API (assume que retorna apenas as aprovadas por padrão)
      const response = await apiFetchPublicacoes();
      setPublicacoes(response.publicacoes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar publicações';
      setError(msg);
      // Alert.alert('Erro', msg); // Não exibimos alerta durante o refresh para não irritar o usuário
    } finally {
      if (!isRefreshing) setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await loadPublicacoes();
    };
    fetchData().catch(err => {
      console.error('Erro ao buscar dados:', err);
    });
  }, [loadPublicacoes]);

  // 6. Função para criar nova publicação com validações e tratamento de erros
  const handleCreatePublicacao = async () => {
    if (!user?.token) {
      Alert.alert('Erro', 'Você precisa estar logado para publicar.');
      return;
    }
    if (!conteudo.trim()) {
      Alert.alert('Erro', 'O conteúdo não pode estar vazio.');
      return;
    }
    // TODO: Adicionar campos adicionais para detalhes do evento quando o tipo selecionado for 'evento'

    setIsCreating(true);
    setError(null);

    const publicacaoData: PublicacaoData = {
      conteudo: conteudo.trim(),
      tipo: tipo,
      // detalhesEvento: tipo === 'evento' ? { /* aqui seriam incluídos os dados específicos do evento */ } : undefined
    };

    try {
      const response = await apiCreatePublicacao(user.token, publicacaoData);
      Alert.alert('Sucesso', response.message || 'Publicação criada!');
      setConteudo(''); // Limpa o campo de conteúdo após a publicação
      // setTipo('post'); // Opcional: Resetar o tipo para 'post' após a publicação
      await loadPublicacoes(true); // Recarrega a lista para mostrar a nova publicação (se for aprovada automaticamente)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao publicar';
      setError(msg);
      Alert.alert('Erro ao Publicar', msg);
    } finally {
      setIsCreating(false);
    }
  };

  // 7. Componentes de renderização para itens da lista com tipagem adequada
  const renderItem = ({ item }: ListRenderItemInfo<Publicacao>): ReactJSX.JSX.Element => (
    <View style={styles.itemContainer}>
      {/* Exibe o nome do autor se disponível, ou um ID parcial como fallback */}
      <Text style={styles.itemAuthor}>{item.autor?.nome || `Usuário (${item.autorId.substring(0, 6)}...)`}</Text>
      <Text style={styles.itemContent}>{item.conteudo}</Text>
      <View style={styles.itemFooter}>
        <Text style={styles.itemMeta}>Tipo: {item.tipo}</Text>
        <Text style={styles.itemMeta}>Em: {new Date(item.dataPostagem).toLocaleDateString('pt-BR')}</Text>
        {/* <Text style={styles.itemMeta}>Status: {item.status}</Text> */}
      </View>
      {/* TODO: Implementar funcionalidades de interação como botões de Curtir, Comentar, etc. */}
    </View>
  );

  const keyExtractor = (item: Publicacao): string => item._id;

  // Componente que será exibido quando a lista de publicações estiver vazia
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text>Nenhuma publicação encontrada.</Text>
    </View>
  );

  // Função auxiliar para criar botões de seleção de tipo de publicação
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

  // Componente para o formulário de criação de publicação (será utilizado como cabeçalho da FlatList)
  const FormHeader = () => (
    <View>
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
        {/* TODO: Adicionar campos de entrada para detalhes do evento aqui, de forma condicional */}
        {/* Exemplo: if (tipo === 'evento') { ... campos para data, local, etc ... } */}

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
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      {/* Utilizamos FlatList com ListHeaderComponent ao invés de ScrollView + FlatList aninhados */}
      {/* Esta abordagem evita o erro "VirtualizedLists should never be nested inside plain ScrollViews" */}
      <FlatList
        style={styles.screenContainer}
        data={loadingList ? [] : publicacoes}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={<FormHeader />}
        ListEmptyComponent={!loadingList ? renderEmptyList : null}
        refreshControl={
          <RefreshControl refreshing={loadingList} onRefresh={() => loadPublicacoes(true)} />
        }
      />
    </KeyboardAvoidingView>
  );
}

// 8. Definição dos estilos visuais de todos os componentes da tela
const styles = StyleSheet.create({
  // Container principal da tela
  screenContainer: {
    flex: 1,
  },
  // Container do formulário de criação de publicação
  formContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // Título do formulário
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: { /* ... (estilos para campos de entrada) ... */ },
  // Área de texto para o conteúdo da publicação
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // Grupo de botões para seleção de tipo de publicação
  typeButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Alinha botões à esquerda da tela
    marginVertical: 15,
  },
  // Estilo base para os botões de tipo
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15, // Formato mais arredondado para os botões
    marginRight: 10,
  },
  // Estilo aplicado quando o botão está selecionado
  typeButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  // Estilo do texto dos botões de tipo
  typeButtonText: {
    color: '#555',
  },
  // Estilo do texto quando o botão está selecionado
  typeButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Container da seção de lista de publicações
  listSectionContainer: {
    padding: 20,
    flex: 1,
  },
  // Título da seção de lista de publicações
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  // Container de cada item (publicação) na lista
  itemContainer: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd', // Borda mais visível para destacar cada publicação
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8, // Bordas arredondadas para melhor aparência
  },
  // Estilo para o nome do autor da publicação
  itemAuthor: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  // Estilo para o conteúdo principal da publicação
  itemContent: {
    fontSize: 15,
    lineHeight: 21,
    color: '#444',
    marginBottom: 10,
  },
  // Rodapé de cada item com metadados da publicação
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 5,
  },
  // Estilo para os metadados (tipo, data) da publicação
  itemMeta: {
    fontSize: 12,
    color: '#777',
  },
  // Container centralizado usado para mensagens de lista vazia
  centerContainer: {
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Estilo para mensagens de erro
  errorText: {
    marginTop: 10,
    marginBottom: 10,
    color: 'red',
    textAlign: 'center',
  },
});
