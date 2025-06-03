/**
 * BuscarOfertasScreen.tsx
 * 
 * Este componente implementa a tela de busca de ofertas do aplicativo.
 * Permite aos usuários pesquisar ofertas por texto, filtrar por categorias,
 * localização e preço máximo, e visualizar os resultados em uma lista.
 * 
 * Funcionalidades principais:
 * - Pesquisa de ofertas por texto
 * - Filtros por categoria, localização e preço
 * - Histórico de buscas e filtros recentes
 * - Suporte a acessibilidade (alto contraste, leitor de tela)
 * - Exibição de ofertas em cards com informações detalhadas
 * - Navegação para detalhes da oferta
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ListRenderItemInfo,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  useWindowDimensions,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SkeletonLoading from '../components/SkeletonLoading';
import { API_URL } from "@/config/api";

// Imports de tipos e API
import { 
  Offer, 
  FetchOffersParams, 
  CategoriaServico, 
  EstadoBrasil, 
  CapitalBrasil, 
  ILocalizacao 
} from "@/types/offer";
import { 
  fetchPublicOffers as apiFetchPublicOffers,
  fetchAuthenticatedOffers as apiFetchAuthenticatedOffers
} from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";
import { useAuth } from "@/context/AuthContext";

// 2. Tipo das Props da Tela
type BuscarOfertasScreenProps = NativeStackScreenProps<RootStackParamList, 'BuscarOfertas'>;

/**
 * Tela para filtrar e pesquisar ofertas públicas (status "ready").
 * Permite buscar por texto e filtrar por preço máximo.
 */
export default function BuscarOfertasScreen({ navigation }: BuscarOfertasScreenProps) {
  /**
   * Estados principais do componente
   * 
   * Aqui são definidos os estados que controlam a busca, os resultados,
   * o carregamento e os erros da tela de busca de ofertas.
   */
  // 3. Tipar Estados
  const [textoPesquisa, setTextoPesquisa] = useState<string>('');
  const [precoMax, setPrecoMax] = useState<string>(''); // Input é string
  const [ofertas, setOfertas] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Inicia como false, busca é manual
  const [error, setError] = useState<string | null>(null);

  /**
   * Estados para acessibilidade
   * 
   * Estes estados controlam as configurações de acessibilidade da tela,
   * como o modo de alto contraste e a detecção do leitor de tela.
   * Permitem adaptar a interface para usuários com necessidades especiais.
   */
  const { fontScale } = useWindowDimensions();
  const [isHighContrastMode, setIsHighContrastMode] = useState<boolean>(false);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState<boolean>(false);

  /**
   * Estados para filtros de categoria e localização
   * 
   * Estes estados controlam os filtros de categoria e localização,
   * incluindo as seleções do usuário e a exibição dos modais de seleção.
   */
  const [categorias, setCategorias] = useState<string[]>([]);
  const [showCategoriasModal, setShowCategoriasModal] = useState<boolean>(false);

  const [localizacao, setLocalizacao] = useState<ILocalizacao>({
    estado: undefined as unknown as EstadoBrasil
  });
  const [showEstadosModal, setShowEstadosModal] = useState<boolean>(false);
  const [showCidadesModal, setShowCidadesModal] = useState<boolean>(false);

  /**
   * Estados para controle de filtros expansíveis
   * 
   * Controlam a animação e exibição dos painéis de filtro expansíveis.
   */
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const filterAnimations = useRef({
    categorias: new Animated.Value(0),
    localizacao: new Animated.Value(0),
    preco: new Animated.Value(0)
  }).current;

  // Mapeamento de estados para suas respectivas capitais
  const estadoParaCapital = useMemo(() => ({
    [EstadoBrasil.AC]: CapitalBrasil.RIO_BRANCO,
    [EstadoBrasil.AL]: CapitalBrasil.MACEIO,
    [EstadoBrasil.AP]: CapitalBrasil.MACAPA,
    [EstadoBrasil.AM]: CapitalBrasil.MANAUS,
    [EstadoBrasil.BA]: CapitalBrasil.SALVADOR,
    [EstadoBrasil.CE]: CapitalBrasil.FORTALEZA,
    [EstadoBrasil.DF]: CapitalBrasil.BRASILIA,
    [EstadoBrasil.ES]: CapitalBrasil.VITORIA,
    [EstadoBrasil.GO]: CapitalBrasil.GOIANIA,
    [EstadoBrasil.MA]: CapitalBrasil.SAO_LUIS,
    [EstadoBrasil.MT]: CapitalBrasil.CUIABA,
    [EstadoBrasil.MS]: CapitalBrasil.CAMPO_GRANDE,
    [EstadoBrasil.MG]: CapitalBrasil.BELO_HORIZONTE,
    [EstadoBrasil.PA]: CapitalBrasil.BELEM,
    [EstadoBrasil.PB]: CapitalBrasil.JOAO_PESSOA,
    [EstadoBrasil.PR]: CapitalBrasil.CURITIBA,
    [EstadoBrasil.PE]: CapitalBrasil.RECIFE,
    [EstadoBrasil.PI]: CapitalBrasil.TERESINA,
    [EstadoBrasil.RJ]: CapitalBrasil.RIO_DE_JANEIRO,
    [EstadoBrasil.RN]: CapitalBrasil.NATAL,
    [EstadoBrasil.RS]: CapitalBrasil.PORTO_ALEGRE,
    [EstadoBrasil.RO]: CapitalBrasil.PORTO_VELHO,
    [EstadoBrasil.RR]: CapitalBrasil.BOA_VISTA,
    [EstadoBrasil.SC]: CapitalBrasil.FLORIANOPOLIS,
    [EstadoBrasil.SP]: CapitalBrasil.SAO_PAULO,
    [EstadoBrasil.SE]: CapitalBrasil.ARACAJU,
    [EstadoBrasil.TO]: CapitalBrasil.PALMAS,
  }), []);

  // Acessa o contexto de autenticação
  const { user, isTokenValid } = useAuth();

  // Variável para controlar se é a primeira renderização
  const [isInitialRender, setIsInitialRender] = useState<boolean>(true);

  // Variável para controlar se uma busca já foi realizada pelo usuário
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);

  // Estados para armazenar buscas e filtros recentes
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentFilters, setRecentFilters] = useState<{
    categorias: string[];
    estado?: EstadoBrasil | 'Acre' | 'Alagoas' | 'Amapá' | 'Amazonas' | 'Bahia' | 'Ceará' | 'Distrito Federal' |
    'Espírito Santo' | 'Goiás' | 'Maranhão' | 'Mato Grosso' | 'Mato Grosso do Sul' |
    'Minas Gerais' | 'Pará' | 'Paraíba' | 'Paraná' | 'Pernambuco' | 'Piauí' |
    'Rio de Janeiro' | 'Rio Grande do Norte' | 'Rio Grande do Sul' | 'Rondônia' |
    'Roraima' | 'Santa Catarina' | 'São Paulo' | 'Sergipe' | 'Tocantins';
    cidade?: string;
    precoMax?: string;
  }[]>([]);

  // Função para obter o tamanho da fonte ajustado com base na escala do sistema
  const getAdjustedFontSize = useCallback((baseSize: number): number => {
    return Math.round(baseSize * fontScale);
  }, [fontScale]);

  // Efeito para verificar se o leitor de tela está ativado
  useEffect(() => {
    const checkScreenReader = async () => {
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(isEnabled);
    };

    checkScreenReader();

    // Adiciona listener para mudanças no estado do leitor de tela
    const listener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => {
      // Remove o listener quando o componente for desmontado
      listener.remove();
    };
  }, []);

  // Função para salvar buscas recentes
  const saveRecentSearch = useCallback(async (searchText: string) => {
    if (!searchText.trim()) return;

    try {
      // Adiciona a nova busca no início do array e remove duplicatas
      const updatedSearches = [searchText, ...recentSearches.filter(s => s !== searchText)];

      // Limita a 5 buscas recentes
      const limitedSearches = updatedSearches.slice(0, 5);

      // Atualiza o estado
      setRecentSearches(limitedSearches);

      // Salva no AsyncStorage
      await AsyncStorage.setItem('recentSearches', JSON.stringify(limitedSearches));
    } catch (error) {
      console.error('Erro ao salvar busca recente:', error);
    }
  }, [recentSearches]);

  // Função para salvar filtros recentes
  const saveRecentFilter = useCallback(async () => {
    // Só salva se houver algum filtro aplicado
    if (categorias.length === 0 && !localizacao.estado && !precoMax) return;

    try {
      // Cria objeto com os filtros atuais
      const currentFilter = {
        categorias: [...categorias],
        estado: localizacao.estado,
        cidade: localizacao.cidade,
        precoMax: precoMax
      };

      // Verifica se já existe um filtro idêntico
      const filterExists = recentFilters.some(filter => 
        JSON.stringify(filter) === JSON.stringify(currentFilter)
      );

      if (filterExists) return;

      // Adiciona o novo filtro no início do array
      const updatedFilters = [currentFilter, ...recentFilters];

      // Limita a 3 filtros recentes
      const limitedFilters = updatedFilters.slice(0, 3);

      // Atualiza o estado
      setRecentFilters(limitedFilters);

      // Salva no AsyncStorage
      await AsyncStorage.setItem('recentFilters', JSON.stringify(limitedFilters));
    } catch (error) {
      console.error('Erro ao salvar filtro recente:', error);
    }
  }, [categorias, localizacao, precoMax, recentFilters]);

  // Função para carregar buscas e filtros recentes
  const loadRecentSearchesAndFilters = useCallback(async () => {
    try {
      // Carrega buscas recentes
      const storedSearches = await AsyncStorage.getItem('recentSearches');
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }

      // Carrega filtros recentes
      const storedFilters = await AsyncStorage.getItem('recentFilters');
      if (storedFilters) {
        setRecentFilters(JSON.parse(storedFilters));
      }
    } catch (error) {
      console.error('Erro ao carregar buscas e filtros recentes:', error);
    }
  }, []);

  // Carrega buscas e filtros recentes ao montar o componente
  useEffect(() => {
    loadRecentSearchesAndFilters();
  }, [loadRecentSearchesAndFilters]);

  /**
   * Função de busca de ofertas
   * 
   * Esta função é responsável por buscar ofertas com base nos filtros aplicados.
   * Processa os parâmetros de busca, faz a requisição à API e atualiza o estado
   * com os resultados obtidos. Também salva buscas e filtros recentes.
   * 
   * @param isUserInitiated Indica se a busca foi iniciada pelo usuário (true) ou pelo sistema (false)
   */
  const handleSearch = useCallback(async (isUserInitiated: boolean = true) => {
    setLoading(true);
    setError(null);
    setOfertas([]); // Limpa resultados anteriores

    // Marca que uma busca foi realizada pelo usuário
    if (isUserInitiated) {
      setSearchPerformed(true);

      // Salva a busca e os filtros recentes se for iniciada pelo usuário
      if (textoPesquisa.trim()) {
        saveRecentSearch(textoPesquisa.trim());
      }

      // Salva os filtros se houver algum aplicado
      saveRecentFilter();
    }

    // Monta objeto de parâmetros para a API
    const params: FetchOffersParams = {
      status: 'ready', // Busca apenas ofertas prontas (conforme descrição original)
      // Adiciona parâmetro para incluir informações do prestador
      // Este parâmetro pode não ser suportado pelo backend, mas é uma tentativa
      // de solicitar que o backend inclua as informações do prestador na resposta
      incluirPrestador: true,
    };

    // Processa o texto de pesquisa para melhorar a correspondência
    // Verifica se o texto de pesquisa é válido (não é null, undefined ou uma string vazia)
    if (typeof textoPesquisa === 'string' && textoPesquisa.trim() !== '') {
      // Normaliza o texto de pesquisa (remove espaços extras, converte para minúsculas)
      const searchText = textoPesquisa.trim().toLowerCase();

      // Adiciona o texto de pesquisa normalizado aos parâmetros
      params.textoPesquisa = searchText;

      // Adiciona log para debug
      console.log('Buscando ofertas com texto:', searchText);
    }
    // Processa o preço máximo apenas se o campo não estiver vazio e for um número válido
    if (precoMax.trim() !== '') {
      const precoMaxNum = Number(precoMax);
      if (!isNaN(precoMaxNum) && precoMaxNum >= 0) {
        params.precoMax = precoMaxNum;
      } else {
        console.log('Preço máximo inválido, ignorando este filtro:', precoMax);
      }
    }
    // Removido o alerta para não interromper o fluxo de busca

    // Adiciona filtros de categoria se houver
    // Verifica se o array de categorias é válido e não está vazio
    if (Array.isArray(categorias) && categorias.length > 0) {
      // Filtra apenas categorias válidas (strings não vazias)
      const categoriasValidas = categorias.filter(cat => 
        typeof cat === 'string' && cat.trim() !== ''
      );
      if (categoriasValidas.length > 0) {
        params.categorias = categoriasValidas;
      }
    }

    // Adiciona filtros de localização se houver
    // Verifica se o estado é válido (não é null, undefined ou uma string vazia)
    if (localizacao.estado && typeof localizacao.estado === 'string' && localizacao.estado.trim() !== '') {
      params.estado = localizacao.estado;
      // Adiciona a cidade apenas se for válida
      if (localizacao.cidade && typeof localizacao.cidade === 'string' && localizacao.cidade.trim() !== '') {
        params.cidade = localizacao.cidade;
      }
    }

    try {
      // Log dos parâmetros de busca para debug
      console.log('Parâmetros de busca:', JSON.stringify(params));

      let response;

      // Verifica se o usuário está autenticado e tem um token válido
      if (user && user.token && isTokenValid) {
        console.log('Buscando ofertas com autenticação');
        // Usa a função de busca autenticada
        response = await apiFetchAuthenticatedOffers(user.token, params);
      } else {
        console.log('Buscando ofertas públicas (sem autenticação)');
        // Usa a função de busca pública
        response = await apiFetchPublicOffers(params);
      }

      console.log(`Encontradas ${response.offers.length} ofertas`);
      setOfertas(response.offers);

      // Anuncia os resultados para leitores de tela
      if (isScreenReaderEnabled) {
        const message = response.offers.length > 0
          ? `Encontradas ${response.offers.length} ofertas.`
          : "Nenhuma oferta encontrada com estes critérios.";
        AccessibilityInfo.announceForAccessibility(message);
      }

      // Se não encontrou ofertas e a busca foi iniciada pelo usuário, mostra uma mensagem
      if (response.offers.length === 0 && isUserInitiated) {
        Alert.alert("Informação", "Nenhuma oferta encontrada com estes critérios.");
      }
    } catch (err) {
      // Tratamento de erro mais robusto
      let errorMessage = 'Ocorreu um erro desconhecido.';

      if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Erro detalhado:', err);
      } else {
        console.error('Erro não identificado:', err);
      }

      // Mensagens de erro mais amigáveis baseadas em padrões comuns
      if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'A requisição demorou muito para responder. Tente novamente mais tarde.';
      } else if (errorMessage.includes('401')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      }

      setError(errorMessage);

      // Só mostra alerta se a busca foi iniciada pelo usuário
      if (isUserInitiated) {
        Alert.alert('Erro ao Buscar Ofertas', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [textoPesquisa, precoMax, categorias, localizacao, user, isTokenValid, isScreenReaderEnabled, saveRecentSearch, saveRecentFilter]); // Depende dos filtros e do estado de autenticação

  // Função para converter preço em indicador visual ($ a $$$$)
  const getPriceIndicator = useCallback((price: number): string => {
    if (price <= 50) return '$';
    if (price <= 150) return '$$';
    if (price <= 300) return '$$$';
    return '$$$$';
  }, []);

  // Função para obter a cor do indicador de preço
  const getPriceIndicatorColor = useCallback((price: number): string => {
    if (price <= 50) return '#28a745'; // Verde para preços baixos
    if (price <= 150) return '#17a2b8'; // Azul para preços médios-baixos
    if (price <= 300) return '#ffc107'; // Amarelo para preços médios-altos
    return '#dc3545'; // Vermelho para preços altos
  }, []);

  // Função para obter cor para cada categoria
  const getCategoryColor = useCallback((category: string): string => {
    // Mapa de cores para categorias específicas
    const categoryColors: Record<string, string> = {
      [CategoriaServico.LIMPEZA]: '#4CAF50',      // Verde
      [CategoriaServico.MANUTENCAO]: '#FF9800',   // Laranja
      [CategoriaServico.REFORMAS]: '#F44336',     // Vermelho
      [CategoriaServico.ELETRICA]: '#FFEB3B',     // Amarelo
      [CategoriaServico.HIDRAULICA]: '#2196F3',   // Azul
      [CategoriaServico.PINTURA]: '#9C27B0',      // Roxo
      [CategoriaServico.JARDINAGEM]: '#8BC34A',   // Verde claro
      [CategoriaServico.INFORMATICA]: '#3F51B5',  // Índigo
      [CategoriaServico.DESIGN]: '#E91E63',       // Rosa
      [CategoriaServico.MARKETING]: '#00BCD4',    // Ciano
      [CategoriaServico.TRADUCAO]: '#607D8B',     // Azul acinzentado
      [CategoriaServico.AULAS]: '#795548',        // Marrom
      [CategoriaServico.CONSULTORIA]: '#9E9E9E',  // Cinza
      [CategoriaServico.SAUDE]: '#4CAF50',        // Verde
      [CategoriaServico.BELEZA]: '#FF4081',       // Rosa
      [CategoriaServico.EVENTOS]: '#673AB7',      // Roxo profundo
      [CategoriaServico.TRANSPORTE]: '#FF5722',   // Laranja profundo
      [CategoriaServico.OUTROS]: '#607D8B',       // Azul acinzentado
    };

    return categoryColors[category] || '#9E9E9E'; // Cinza como cor padrão
  }, []);

  // Cores para modo normal e alto contraste
  const colors = useMemo(() => {
    return isHighContrastMode 
      ? {
          // Cores de alto contraste (maior contraste para melhor legibilidade)
          primary: '#0056b3',         // Azul mais escuro
          secondary: '#004085',       // Azul ainda mais escuro
          success: '#155724',         // Verde escuro
          background: '#FFFFFF',      // Branco puro
          text: '#000000',            // Preto puro
          textSecondary: '#222222',   // Quase preto
          border: '#000000',          // Preto
          inputBackground: '#FFFFFF', // Branco
          cardBackground: '#FFFFFF',  // Branco
          error: '#721c24',           // Vermelho escuro
          warning: '#856404',         // Amarelo escuro
        }
      : {
          // Cores normais (já definidas no estilo original)
          primary: '#007bff',
          secondary: '#6c757d',
          success: '#28a745',
          background: '#f8f9fa',
          text: '#333333',
          textSecondary: '#666666',
          border: '#cccccc',
          inputBackground: '#ffffff',
          cardBackground: '#ffffff',
          error: '#dc3545',
          warning: '#ffc107',
        };
  }, [isHighContrastMode]);

  /**
   * Renderiza um item da lista de ofertas
   * 
   * Esta função é responsável por renderizar cada oferta na lista de resultados.
   * Cria um card com informações da oferta, incluindo título, prestador, preço,
   * localização e categorias. Também aplica estilos condicionais baseados nas
   * configurações de acessibilidade.
   * 
   * @param item A oferta a ser renderizada
   * @returns Componente React representando o card da oferta
   */
  const renderItem = useCallback(({ item }: ListRenderItemInfo<Offer>): React.ReactElement => {
    // Log para debug - ver o que está vindo na oferta
    console.log('[RENDER_ITEM] Dados do prestador:', JSON.stringify(item.prestadorId));

    // Determina o nome do prestador para exibição
    let nomePrestador = 'Prestador de Serviço';
    let fotoUrl = null;

    // Verifica se prestadorId é um objeto com propriedade nome
    if (typeof item.prestadorId === 'object' && item.prestadorId !== null) {
      if (item.prestadorId.nome) {
        nomePrestador = item.prestadorId.nome;
      }

      // Tenta obter a foto do prestador se disponível
      if (item.prestadorId.foto) {
        fotoUrl = item.prestadorId.foto;
      }
    }

    // Indicador visual de preço
    const priceIndicator = getPriceIndicator(item.preco);
    const priceColor = getPriceIndicatorColor(item.preco);

    // Gera as iniciais do nome para o avatar (caso não tenha foto)
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    };

    const prestadorInitials = getInitials(nomePrestador);

    return (
      <TouchableOpacity
        style={[
          styles.cardContainer,
          { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.border
          }
        ]}
        onPress={() => {
          // Navega para a tela de detalhes da oferta
          navigation.navigate('OfferDetail', { 
            offerId: item._id
          });
        }}
        accessibilityLabel={`Oferta de ${item.descricao} por ${nomePrestador}`}
        accessibilityHint="Toque para ver detalhes da oferta"
        accessibilityRole="button"
      >
        <View style={styles.cardHeader}>
          {/* Avatar do prestador */}
          <View style={styles.avatarContainer}>
            {fotoUrl ? (
              <Image 
                source={{ uri: fotoUrl.startsWith('http') ? fotoUrl : `${API_URL}/${fotoUrl}` }} 
                style={styles.avatarImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0') }]}>
                <Text style={styles.avatarInitials}>{prestadorInitials}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerTextContainer}>
            <Text 
              style={[
                styles.itemTitle, 
                { 
                  color: colors.text,
                  fontSize: getAdjustedFontSize(16)
                }
              ]} 
              numberOfLines={1}
              accessibilityRole="text"
            >
              {item.descricao}
            </Text>
            <Text 
              style={[
                styles.prestadorName,
                {
                  color: colors.textSecondary,
                  fontSize: getAdjustedFontSize(14)
                }
              ]}
              accessibilityRole="text"
            >
              {nomePrestador}
            </Text>
          </View>

          {/* Indicador visual de preço */}
          <View 
            style={[
              styles.priceIndicator, 
              { 
                backgroundColor: isHighContrastMode 
                  ? getPriceIndicatorColor(item.preco) 
                  : priceColor 
              }
            ]}
            accessibilityLabel={`Faixa de preço: ${priceIndicator}`}
          >
            <Text 
              style={[
                styles.priceIndicatorText,
                { fontSize: getAdjustedFontSize(14) }
              ]}
            >
              {priceIndicator}
            </Text>
          </View>
        </View>

        <View style={[
          styles.cardContent,
          { borderBottomColor: colors.border }
        ]}>
          <Text 
            style={[
              styles.itemDetail,
              { 
                color: colors.text,
                fontSize: getAdjustedFontSize(14)
              }
            ]}
            accessibilityLabel={`Preço: R$ ${item.preco.toFixed(2)}`}
          >
            <Text 
              style={[
                styles.detailLabel,
                { 
                  color: colors.text,
                  fontWeight: 'bold',
                  fontSize: getAdjustedFontSize(14)
                }
              ]}
            >
              Preço: 
            </Text>
            {` R$ ${item.preco.toFixed(2)}`}
          </Text>

          <Text 
            style={[
              styles.itemDetail,
              { 
                color: colors.text,
                fontSize: getAdjustedFontSize(14)
              }
            ]}
            accessibilityLabel={`Localização: ${item.localizacao 
              ? `${item.localizacao.estado}${item.localizacao.cidade ? `, ${item.localizacao.cidade}` : ''}` 
              : 'Não especificada'}`}
          >
            <Text 
              style={[
                styles.detailLabel,
                { 
                  color: colors.text,
                  fontWeight: 'bold',
                  fontSize: getAdjustedFontSize(14)
                }
              ]}
            >
              Localização: 
            </Text>
            {` ${item.localizacao 
              ? `${item.localizacao.estado}${item.localizacao.cidade ? `, ${item.localizacao.cidade}` : ''}` 
              : 'Não especificada'
            }`}
          </Text>
        </View>

        {/* Badges para categorias */}
        {item.categorias && item.categorias.length > 0 && (
          <View 
            style={[
              styles.categoriesContainer,
              { padding: 12 }
            ]}
            accessibilityLabel={`Categorias: ${item.categorias.join(', ')}`}
          >
            {item.categorias.map((categoria, index) => {
              // Obter cor da categoria com ajuste para alto contraste se necessário
              const categoryColor = isHighContrastMode 
                ? getCategoryColor(categoria) // Já deve ser uma cor de alto contraste
                : getCategoryColor(categoria);

              return (
                <View 
                  key={index} 
                  style={[
                    styles.categoryBadge, 
                    { 
                      backgroundColor: categoryColor,
                      // Adiciona borda para melhorar contraste em modo de alto contraste
                      borderWidth: isHighContrastMode ? 1 : 0,
                      borderColor: isHighContrastMode ? '#000000' : 'transparent'
                    }
                  ]}
                  accessibilityLabel={`Categoria: ${categoria}`}
                >
                  <Text 
                    style={[
                      styles.categoryText,
                      { 
                        fontSize: getAdjustedFontSize(12),
                        // Garante texto branco para melhor contraste com fundo colorido
                        color: isHighContrastMode ? '#FFFFFF' : 'white'
                      }
                    ]}
                  >
                    {categoria}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [navigation, getPriceIndicator, getPriceIndicatorColor, getCategoryColor, API_URL, isHighContrastMode, colors, getAdjustedFontSize]);

  // Extrai a chave única para cada item da lista
  const keyExtractor = useCallback((item: Offer): string => item._id, []);

  // Componente para lista vazia
  const renderEmptyList = useCallback(() => (
    <View 
      style={[
        styles.centerContainer,
        { backgroundColor: colors.background }
      ]}
      accessibilityLabel="Nenhum resultado encontrado"
      accessibilityRole="text"
    >
      {/* Não mostra mensagem na primeira renderização, apenas após busca */}
      {!isInitialRender && (
        <Text 
          style={{ 
            color: colors.text,
            fontSize: getAdjustedFontSize(16),
            textAlign: 'center'
          }}
        >
          Nenhuma oferta encontrada com estes critérios.
        </Text>
      )}
    </View>
  ), [isInitialRender, colors, getAdjustedFontSize]);

  /**
   * Função para lidar com o botão "Ver Ofertas"
   * 
   * Esta função é acionada quando o usuário clica no botão "Ver Ofertas".
   * Limpa todos os filtros aplicados e busca todas as ofertas disponíveis,
   * independentemente de categorias, localização ou preço.
   */
  const handleVerTodasOfertas = useCallback(() => {
    console.log('[VER OFERTAS] Iniciando busca de todas as ofertas disponíveis...');
    console.log('[VER OFERTAS] API_URL configurada:', API_URL);

    // Salva os filtros atuais antes de limpar (se houver algum aplicado)
    saveRecentFilter();

    // Limpa todos os filtros na UI
    setTextoPesquisa('');
    setPrecoMax('');
    setCategorias([]);
    setLocalizacao({
      estado: null as unknown as EstadoBrasil,
      cidade: undefined
    });

    // Marca que uma busca foi realizada pelo usuário
    setSearchPerformed(true);

    // Inicia a busca imediatamente
    setLoading(true);
    setError(null);
    setOfertas([]); // Limpa resultados anteriores

    // Cria parâmetros diretamente em vez de depender dos estados atualizados
    const params: FetchOffersParams = {
      status: 'ready', // Busca apenas ofertas prontas
      // Adiciona parâmetro para incluir informações do prestador
      incluirPrestador: true,
    };

    console.log('[VER OFERTAS] Parâmetros de busca:', JSON.stringify(params));

    // Executa a busca diretamente com os parâmetros criados
    try {
      let fetchPromise;
      if (user && user.token && isTokenValid) {
        console.log('[VER OFERTAS] Usando modo autenticado com token:', user.token.substring(0, 15) + '...');
        fetchPromise = apiFetchAuthenticatedOffers(user.token, params);
      } else {
        console.log('[VER OFERTAS] Usando modo público (sem autenticação)');
        fetchPromise = apiFetchPublicOffers(params);
      }

      console.log('[VER OFERTAS] Requisição enviada, aguardando resposta...');

      fetchPromise
        .then(response => {
          console.log(`[VER OFERTAS] Resposta recebida com sucesso. Encontradas ${response.offers.length} ofertas`);
          if (response.offers.length > 0) {
            console.log('[VER OFERTAS] Primeira oferta:', JSON.stringify(response.offers[0]));
          }
          setOfertas(response.offers);

          // Anuncia os resultados para leitores de tela
          if (isScreenReaderEnabled) {
            const message = response.offers.length > 0
              ? `Encontradas ${response.offers.length} ofertas.`
              : "Nenhuma oferta encontrada com estes critérios.";
            AccessibilityInfo.announceForAccessibility(message);
          }

          // Se não encontrou ofertas, mostra uma mensagem
          if (response.offers.length === 0) {
            console.log('[VER OFERTAS] Nenhuma oferta encontrada');
            Alert.alert("Informação", "Nenhuma oferta encontrada com estes critérios.");
          }
        })
        .catch(err => {
          // Tratamento de erro mais robusto
          let errorMessage = 'Ocorreu um erro desconhecido.';

          if (err instanceof Error) {
            errorMessage = err.message;
            console.error('[VER OFERTAS] Erro detalhado:', err);
          } else {
            console.error('[VER OFERTAS] Erro não identificado:', err);
          }

          // Mensagens de erro mais amigáveis baseadas em padrões comuns
          if (errorMessage.includes('network') || errorMessage.includes('Network')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else if (errorMessage.includes('timeout')) {
            errorMessage = 'A requisição demorou muito para responder. Tente novamente mais tarde.';
          } else if (errorMessage.includes('401')) {
            errorMessage = 'Sessão expirada. Faça login novamente.';
          }

          console.error('[VER OFERTAS] Erro na requisição:', errorMessage);
          setError(errorMessage);
          Alert.alert('Erro ao Buscar Ofertas', errorMessage);
        })
        .finally(() => {
          console.log('[VER OFERTAS] Finalizando operação de busca');
          setLoading(false);
        });
    } catch (err) {
      // Tratamento de erro mais robusto para erros ao iniciar a requisição
      let errorMessage = 'Ocorreu um erro desconhecido ao iniciar a busca.';

      if (err instanceof Error) {
        errorMessage = err.message;
        console.error('[VER OFERTAS] Erro detalhado ao iniciar requisição:', err);
      } else {
        console.error('[VER OFERTAS] Erro não identificado ao iniciar requisição:', err);
      }

      // Mensagens de erro mais amigáveis baseadas em padrões comuns
      if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'A requisição demorou muito para responder. Tente novamente mais tarde.';
      } else if (errorMessage.includes('401')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      }

      setError(errorMessage);
      Alert.alert('Erro ao Buscar Ofertas', errorMessage);
      setLoading(false);
    }
  }, [user, isTokenValid, isScreenReaderEnabled, saveRecentFilter]);


  /**
   * Função para expandir/recolher os filtros
   * 
   * Esta função controla a expansão e recolhimento dos painéis de filtro.
   * Quando um filtro é clicado, ele expande se estiver fechado ou recolhe
   * se já estiver aberto. Também anima a transição e anuncia a mudança
   * para leitores de tela.
   * 
   * @param filterName Nome do filtro a ser expandido/recolhido
   */
  const toggleFilterExpand = useCallback((filterName: string) => {
    // Determina o novo estado expandido
    const newExpandedFilter = expandedFilter === filterName ? null : filterName;

    // Atualiza o estado
    setExpandedFilter(newExpandedFilter);

    // Anima todos os filtros
    Object.keys(filterAnimations).forEach(key => {
      const toValue = key === filterName && newExpandedFilter === filterName ? 1 : 0;
      Animated.spring(filterAnimations[key as keyof typeof filterAnimations], {
        toValue,
        useNativeDriver: false,
        friction: 8,
        tension: 40
      }).start();
    });

    // Anuncia a mudança para leitores de tela
    if (isScreenReaderEnabled) {
      let filterNamePtBr = '';
      switch (filterName) {
        case 'categorias':
          filterNamePtBr = 'categorias';
          break;
        case 'localizacao':
          filterNamePtBr = 'localização';
          break;
        case 'preco':
          filterNamePtBr = 'preço';
          break;
        default:
          filterNamePtBr = filterName;
      }

      const message = newExpandedFilter === filterName
        ? `Filtro de ${filterNamePtBr} expandido`
        : `Filtro de ${filterNamePtBr} recolhido`;

      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [expandedFilter, filterAnimations, isScreenReaderEnabled]);

  // Função para navegar para a tela de login
  const handleLoginPress = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  // Função para alternar o modo de alto contraste
  const toggleHighContrastMode = useCallback(() => {
    setIsHighContrastMode(prev => !prev);
    // Anuncia a mudança para leitores de tela
    AccessibilityInfo.announceForAccessibility(
      isHighContrastMode 
        ? 'Modo de alto contraste desativado' 
        : 'Modo de alto contraste ativado'
    );
  }, [isHighContrastMode]);


  // Efeito para buscar ofertas automaticamente quando o estado de autenticação mudar (mas não na primeira renderização)
  useEffect(() => {
    // Pula a busca automática na primeira renderização
    if (isInitialRender) {
      setIsInitialRender(false);
      return;
    }

    // Só executa a busca automática se não estiver já carregando e se uma busca já foi realizada pelo usuário
    if (!loading && searchPerformed) {
      console.log('Executando busca automática devido a mudança no estado de autenticação');
      handleSearch(false) // false indica que não foi iniciado pelo usuário
        .catch(err => {
          console.error('Erro na busca automática:', err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isTokenValid]); // Dependências: estado de autenticação

  return (
    <View style={styles.screenContainer}>
      <View style={styles.searchContainer}>
        {/* Banner informativo sobre os benefícios de fazer login - só aparece quando o usuário não está logado */}
        {!user && (
          <View style={styles.loginBanner}>
            <View style={styles.loginBannerIconContainer}>
              <Text style={styles.loginBannerIcon}>🔐</Text>
            </View>
            <View style={styles.loginBannerTextContainer}>
              <Text style={styles.loginBannerTitle}>Faça login para uma experiência completa!</Text>
              <Text style={styles.loginBannerDescription}>
                Acesse histórico de serviços, salve favoritos e receba ofertas exclusivas.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.loginBannerButton}
              onPress={handleLoginPress}
            >
              <Text style={styles.loginBannerButtonText}>ENTRAR</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerRow}>
          <Text 
            style={[
              styles.title, 
              { 
                color: colors.text,
                fontSize: getAdjustedFontSize(20)
              }
            ]}
            accessibilityRole="header"
          >
            Buscar Ofertas
          </Text>

          {/* Botão de acessibilidade para alternar o modo de alto contraste */}
          <TouchableOpacity
            style={[
              styles.accessibilityButton,
              isHighContrastMode && styles.accessibilityButtonActive
            ]}
            onPress={toggleHighContrastMode}
            accessibilityRole="switch"
            accessibilityState={{ checked: isHighContrastMode }}
            accessibilityLabel="Alternar modo de alto contraste"
            accessibilityHint="Ativa ou desativa cores com maior contraste para melhor visualização"
          >
            <Text style={styles.accessibilityButtonIcon}>Aa</Text>
          </TouchableOpacity>
        </View>

        {/* Caixa de pesquisa e botão lado a lado */}
        <View style={styles.searchRow}>
          <TextInput
            placeholder="pesquise uma oferta"
            value={textoPesquisa}
            onChangeText={setTextoPesquisa}
            style={[
              styles.searchInput,
              { 
                borderColor: colors.border,
                backgroundColor: colors.inputBackground,
                color: colors.text,
                fontSize: getAdjustedFontSize(14)
              }
            ]}
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(true)}
            accessibilityLabel="Campo de pesquisa de ofertas"
            accessibilityHint="Digite o que você está procurando"
            accessibilityRole="search"
          />
          <TouchableOpacity
            style={[
              styles.searchButton,
              { backgroundColor: colors.success }
            ]}
            onPress={() => handleSearch(true)}
            disabled={loading}
            accessibilityLabel="Botão de busca"
            accessibilityHint="Toque para buscar ofertas com os critérios informados"
            accessibilityRole="button"
            accessibilityState={{ disabled: loading, busy: loading }}
          >
            <Text 
              style={[
                styles.searchButtonText,
                { fontSize: getAdjustedFontSize(14) }
              ]}
            >
              {loading ? "..." : "BUSCAR"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buscas recentes */}
        {recentSearches.length > 0 && (
          <View style={styles.recentSearchesContainer}>
            <Text 
              style={[
                styles.recentSearchesTitle,
                { 
                  color: colors.text,
                  fontSize: getAdjustedFontSize(14)
                }
              ]}
              accessibilityRole="header"
            >
              Buscas recentes:
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.recentSearchesScroll}
            >
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.recentSearchChip,
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => {
                    setTextoPesquisa(search);
                    handleSearch(true);
                  }}
                  accessibilityLabel={`Busca recente: ${search}`}
                  accessibilityHint="Toque para repetir esta busca"
                  accessibilityRole="button"
                >
                  <Text 
                    style={[
                      styles.recentSearchText,
                      { 
                        color: colors.primary,
                        fontSize: getAdjustedFontSize(12)
                      }
                    ]}
                  >
                    {search}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Filtros recentes */}
        {recentFilters.length > 0 && (
          <View style={styles.recentFiltersContainer}>
            <Text 
              style={[
                styles.recentFiltersTitle,
                { 
                  color: colors.text,
                  fontSize: getAdjustedFontSize(14)
                }
              ]}
              accessibilityRole="header"
            >
              Filtros populares:
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.recentFiltersScroll}
            >
              {recentFilters.map((filter, index) => {
                // Cria uma descrição do filtro para exibição
                const filterDescription = [
                  filter.categorias.length > 0 ? `${filter.categorias.length} categorias` : null,
                  filter.estado ? `${filter.estado}${filter.cidade ? ` (${filter.cidade})` : ''}` : null,
                  filter.precoMax ? `Até R$ ${filter.precoMax}` : null
                ].filter(Boolean).join(', ');

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.recentFilterChip,
                      { 
                        backgroundColor: colors.primary,
                      }
                    ]}
                    onPress={() => {
                      // Aplica o filtro salvo
                      setCategorias(filter.categorias || []);
                      setLocalizacao({
                        estado: filter.estado as EstadoBrasil,
                        cidade: filter.cidade
                      });
                      setPrecoMax(filter.precoMax || '');

                      // Executa a busca
                      handleSearch(true);
                    }}
                    accessibilityLabel={`Filtro popular: ${filterDescription}`}
                    accessibilityHint="Toque para aplicar este filtro"
                    accessibilityRole="button"
                  >
                    <Text 
                      style={[
                        styles.recentFilterText,
                        { 
                          color: 'white',
                          fontSize: getAdjustedFontSize(12)
                        }
                      ]}
                    >
                      {filterDescription}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Abas de filtro */}
        <View style={[
          styles.filterTabsContainer,
          { 
            borderColor: colors.border,
          }
        ]}>
          {/* Tab de Categorias */}
          <TouchableOpacity
            style={[
              styles.filterTab,
              { 
                backgroundColor: expandedFilter === 'categorias' 
                  ? isHighContrastMode ? '#e0f0ff' : '#e6f7ff'
                  : colors.background,
                borderRightColor: colors.border,
                borderBottomColor: expandedFilter === 'categorias' ? colors.primary : 'transparent',
              }
            ]}
            onPress={() => toggleFilterExpand('categorias')}
            disabled={loading}
            accessibilityLabel="Filtro de categorias"
            accessibilityHint={expandedFilter === 'categorias' 
              ? "Toque para fechar o filtro de categorias" 
              : "Toque para abrir o filtro de categorias"}
            accessibilityRole="tab"
            accessibilityState={{ 
              expanded: expandedFilter === 'categorias',
              disabled: loading,
              selected: categorias.length > 0
            }}
          >
            <Text style={[
              styles.filterTabText,
              { 
                color: expandedFilter === 'categorias' 
                  ? colors.primary 
                  : categorias.length > 0 
                    ? colors.success 
                    : colors.textSecondary,
                fontSize: getAdjustedFontSize(13),
                fontWeight: expandedFilter === 'categorias' || categorias.length > 0 ? 'bold' : 'normal'
              }
            ]}>
              Categorias {categorias.length > 0 ? `(${categorias.length})` : ''}
            </Text>
          </TouchableOpacity>

          {/* Tab de Localização */}
          <TouchableOpacity
            style={[
              styles.filterTab,
              { 
                backgroundColor: expandedFilter === 'localizacao' 
                  ? isHighContrastMode ? '#e0f0ff' : '#e6f7ff'
                  : colors.background,
                borderRightColor: colors.border,
                borderBottomColor: expandedFilter === 'localizacao' ? colors.primary : 'transparent',
              }
            ]}
            onPress={() => toggleFilterExpand('localizacao')}
            disabled={loading}
            accessibilityLabel="Filtro de localização"
            accessibilityHint={expandedFilter === 'localizacao' 
              ? "Toque para fechar o filtro de localização" 
              : "Toque para abrir o filtro de localização"}
            accessibilityRole="tab"
            accessibilityState={{ 
              expanded: expandedFilter === 'localizacao',
              disabled: loading,
              selected: localizacao.estado ? true : false
            }}
          >
            <Text style={[
              styles.filterTabText,
              { 
                color: expandedFilter === 'localizacao' 
                  ? colors.primary 
                  : localizacao.estado 
                    ? colors.success 
                    : colors.textSecondary,
                fontSize: getAdjustedFontSize(13),
                fontWeight: expandedFilter === 'localizacao' || localizacao.estado ? 'bold' : 'normal'
              }
            ]}>
              Localização {localizacao.estado ? '✓' : ''}
            </Text>
          </TouchableOpacity>

          {/* Tab de Preço */}
          <TouchableOpacity
            style={[
              styles.filterTab,
              { 
                backgroundColor: expandedFilter === 'preco' 
                  ? isHighContrastMode ? '#e0f0ff' : '#e6f7ff'
                  : colors.background,
                borderRightColor: colors.border,
                borderBottomColor: expandedFilter === 'preco' ? colors.primary : 'transparent',
              }
            ]}
            onPress={() => toggleFilterExpand('preco')}
            disabled={loading}
            accessibilityLabel="Filtro de preço"
            accessibilityHint={expandedFilter === 'preco' 
              ? "Toque para fechar o filtro de preço" 
              : "Toque para abrir o filtro de preço"}
            accessibilityRole="tab"
            accessibilityState={{ 
              expanded: expandedFilter === 'preco',
              disabled: loading,
              selected: precoMax.trim() !== ''
            }}
          >
            <Text style={[
              styles.filterTabText,
              { 
                color: expandedFilter === 'preco' 
                  ? colors.primary 
                  : precoMax.trim() !== '' 
                    ? colors.success 
                    : colors.textSecondary,
                fontSize: getAdjustedFontSize(13),
                fontWeight: expandedFilter === 'preco' || precoMax.trim() !== '' ? 'bold' : 'normal'
              }
            ]}>
              Preço {precoMax.trim() !== '' ? `(R$ ${precoMax})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo expandido dos filtros */}
        {/* Filtro de Categorias */}
        <Animated.View style={[
          styles.expandedFilterContent,
          {
            maxHeight: filterAnimations.categorias.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200]
            }),
            opacity: filterAnimations.categorias,
            overflow: 'hidden',
          }
        ]}>
          <View style={styles.expandedFilterInner}>
            <Text style={styles.expandedFilterLabel}>
              {categorias.length > 0 
                ? `Categorias selecionadas (${categorias.length}):` 
                : 'Nenhuma categoria selecionada'}
            </Text>
            {categorias.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.selectedCategoriesScroll}
              >
                {categorias.map((cat, index) => (
                  <View key={index} style={styles.selectedCategoryChip}>
                    <Text style={styles.selectedCategoryText}>{cat}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.expandedFilterButton}
              onPress={() => setShowCategoriasModal(true)}
            >
              <Text style={styles.expandedFilterButtonText}>
                {categorias.length > 0 ? 'Alterar Categorias' : 'Selecionar Categorias'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Filtro de Localização */}
        <Animated.View style={[
          styles.expandedFilterContent,
          {
            maxHeight: filterAnimations.localizacao.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200]
            }),
            opacity: filterAnimations.localizacao,
            overflow: 'hidden',
          }
        ]}>
          <View style={styles.expandedFilterInner}>
            <Text style={styles.expandedFilterLabel}>
              {localizacao.estado 
                ? `Estado: ${localizacao.estado}${localizacao.cidade ? `, Cidade: ${localizacao.cidade}` : ''}` 
                : 'Nenhuma localização selecionada'}
            </Text>
            <View style={styles.expandedFilterButtonRow}>
              <TouchableOpacity
                style={[styles.expandedFilterButton, styles.expandedFilterButtonHalf]}
                onPress={() => setShowEstadosModal(true)}
              >
                <Text style={styles.expandedFilterButtonText}>
                  {localizacao.estado ? 'Alterar Estado' : 'Selecionar Estado'}
                </Text>
              </TouchableOpacity>

              {localizacao.estado && (
                <TouchableOpacity
                  style={[styles.expandedFilterButton, styles.expandedFilterButtonHalf]}
                  onPress={() => setShowCidadesModal(true)}
                >
                  <Text style={styles.expandedFilterButtonText}>
                    {localizacao.cidade ? 'Alterar Cidade' : 'Selecionar Cidade'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Filtro de Preço */}
        <Animated.View style={[
          styles.expandedFilterContent,
          {
            maxHeight: filterAnimations.preco.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 150]
            }),
            opacity: filterAnimations.preco,
            overflow: 'hidden',
          }
        ]}>
          <View style={styles.expandedFilterInner}>
            <Text style={styles.expandedFilterLabel}>Preço máximo:</Text>
            <TextInput
              placeholder="Digite o valor máximo (R$)"
              value={precoMax}
              onChangeText={setPrecoMax}
              keyboardType="numeric"
              style={styles.expandedFilterInput}
              editable={!loading}
            />
          </View>
        </Animated.View>

        {/* Botão Ver Todas as Ofertas */}
        <TouchableOpacity 
          style={[
            styles.verTodasButton,
            { 
              backgroundColor: colors.primary,
              opacity: loading ? 0.7 : 1
            }
          ]}
          onPress={handleVerTodasOfertas}
          disabled={loading}
          accessibilityLabel="Ver todas as ofertas"
          accessibilityHint="Toque para ver todas as ofertas disponíveis"
          accessibilityRole="button"
          accessibilityState={{ 
            disabled: loading,
            busy: loading
          }}
        >
          <Text 
            style={[
              styles.verTodasButtonText,
              { fontSize: getAdjustedFontSize(16) }
            ]}
          >
            VER OFERTAS
          </Text>
        </TouchableOpacity>
      </View>

      {/* UI para Carregamento com Skeleton Screen 
       * Implementação de feedback visual mais informativo durante o carregamento
       * Mostra esqueletos que representam a estrutura das ofertas que estão sendo carregadas
       * Inclui animação de shimmer para indicar que o conteúdo está carregando
       */}
      {loading && (
        <View style={styles.loadingContainer}>
          <SkeletonLoading count={6} />
        </View>
      )}
      {error && !loading && ( // Mostra erro apenas se não estiver carregando
        <View 
          style={[
            styles.centerContainer,
            { backgroundColor: colors.background }
          ]}
          accessibilityLabel={`Erro: ${error}`}
          accessibilityRole="alert"
        >
          <Text 
            style={[
              styles.errorText,
              { 
                color: colors.error,
                fontSize: getAdjustedFontSize(16),
                fontWeight: 'bold'
              }
            ]}
          >
            Erro: {error}
          </Text>
        </View>
      )}

      {/* Lista de Resultados (só mostra se não estiver carregando, sem erro e após uma busca) */}
      {!loading && !error && searchPerformed && (
        <FlatList
          data={ofertas}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyList} // 9. Componente lista vazia
          style={styles.list}
          contentContainerStyle={ofertas.length === 0 ? styles.listEmptyContainer : {}}
          accessible={true}
          accessibilityLabel={`Lista de ofertas, ${ofertas.length} resultados encontrados`}
          accessibilityHint="Deslize para cima ou para baixo para navegar entre as ofertas"
          accessibilityRole="list"
          // Melhora a experiência de navegação com leitor de tela
          removeClippedSubviews={false}
        />
      )}

      {/* Modal para seleção de categorias */}
      <Modal
        visible={showCategoriasModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoriasModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione as Categorias</Text>
            <ScrollView style={styles.modalScrollView}>
              {Object.values(CategoriaServico).map((categoria, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalItem,
                    categorias.includes(categoria) && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    if (categorias.includes(categoria)) {
                      setCategorias(categorias.filter(cat => cat !== categoria));
                    } else {
                      setCategorias([...categorias, categoria]);
                    }
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    categorias.includes(categoria) && styles.modalItemTextSelected
                  ]}>
                    {categoria}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCategoriasModal(false)}
            >
              <Text style={styles.modalButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleção de estados */}
      <Modal
        visible={showEstadosModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEstadosModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Estado</Text>
            <ScrollView style={styles.modalScrollView}>
              {Object.values(EstadoBrasil).map((estado, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalItem,
                    localizacao.estado === estado && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setLocalizacao({
                      estado: estado,
                      cidade: estadoParaCapital[estado]
                    });
                    setShowEstadosModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    localizacao.estado === estado && styles.modalItemTextSelected
                  ]}>
                    {estado}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowEstadosModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleção de cidades */}
      <Modal
        visible={showCidadesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCidadesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Capital do Estado</Text>
            <ScrollView style={styles.modalScrollView}>
              {localizacao.estado && (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    localizacao.cidade === estadoParaCapital[localizacao.estado] && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setLocalizacao({
                      ...localizacao,
                      cidade: estadoParaCapital[localizacao.estado]
                    });
                    setShowCidadesModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    localizacao.cidade === estadoParaCapital[localizacao.estado] && styles.modalItemTextSelected
                  ]}>
                    {estadoParaCapital[localizacao.estado]}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCidadesModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/**
 * Estilos do componente
 * 
 * Define todos os estilos utilizados na tela de busca de ofertas.
 * Inclui estilos para containers, inputs, botões, cards, filtros,
 * modais e elementos de acessibilidade.
 */
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 12, // Padding reduzido
  },
  searchContainer: {
    marginBottom: 12, // Espaço reduzido
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // Estilos para buscas recentes
  recentSearchesContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  recentSearchesTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  recentSearchesScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  recentSearchChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  recentSearchText: {
    fontSize: 12,
    color: '#007bff',
  },
  // Estilos para filtros recentes
  recentFiltersContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  recentFiltersTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  recentFiltersScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  recentFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#007bff',
  },
  recentFilterText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  title: {
    fontSize: 20, // Tamanho reduzido
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  // Estilos para o botão de acessibilidade
  accessibilityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  accessibilityButtonActive: {
    backgroundColor: '#0056b3',
    borderColor: '#003580',
  },
  accessibilityButtonIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  verTodasButton: {
    backgroundColor: '#007bff',
    padding: 12, // Padding aumentado para destacar como ação principal
    borderRadius: 5,
    marginTop: 12, // Margem superior para separar dos filtros
    alignItems: 'center',
    width: '100%', // Ocupa toda a largura disponível
  },
  verTodasButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16, // Tamanho aumentado para destacar
  },
  // Novos estilos para o layout melhorado
  searchRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#28a745', // Cor verde para diferenciar do botão VER OFERTAS
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80, // Garante uma largura mínima para o botão
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Estilos para os filtros expansíveis
  filterTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterTab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  filterTabActive: {
    backgroundColor: '#e6f7ff',
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  filterTabText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  filterTabTextActive: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  filterTabTextSelected: {
    color: '#28a745',
  },
  expandedFilterContent: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 8,
  },
  expandedFilterInner: {
    padding: 12,
  },
  expandedFilterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  expandedFilterInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  expandedFilterButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  expandedFilterButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  expandedFilterButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expandedFilterButtonHalf: {
    flex: 0.48, // Ligeiramente menor que 0.5 para ter um pequeno espaço entre os botões
  },
  selectedCategoriesScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  selectedCategoryChip: {
    backgroundColor: '#e6f7ff',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  selectedCategoryText: {
    color: '#007bff',
    fontSize: 12,
    fontWeight: '500',
  },
  // Estilos antigos mantidos para compatibilidade
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filterItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    marginHorizontal: 3,
  },
  citySelector: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  // Estilos existentes mantidos
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8, // Padding reduzido
    marginBottom: 10,
    fontSize: 14, // Tamanho reduzido
    backgroundColor: '#fff',
  },
  inputText: {
    color: '#333',
    fontSize: 14,
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
  inputHalf: {
    flex: 1,
    marginHorizontal: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  list: {
    flex: 1, // Faz a lista ocupar o espaço restante
    marginTop: 10,
  },
  listEmptyContainer: {
    flex: 1, // Centraliza o empty component se a lista ocupa espaço
    justifyContent: 'center',
    alignItems: 'center'
  },
  centerContainer: { // Para Error, Empty List
    // flex: 1, // Pode causar problemas se usado dentro de outro container flex
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: { // Container específico para o skeleton loading
    flex: 1,
    paddingTop: 10,
  },
  // Estilos para o novo design de cards
  cardContainer: {
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  prestadorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  priceIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
  },
  priceIndicatorText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardContent: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemDetail: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
  },
  detailLabel: {
    fontWeight: '500',
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingTop: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  // Mantendo o estilo antigo para compatibilidade
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 5,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  // Estilos para os modais
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalScrollView: {
    width: '100%',
    marginBottom: 15,
  },
  modalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemSelected: {
    backgroundColor: '#e6f7ff',
  },
  modalItemText: {
    fontSize: 16,
  },
  modalItemTextSelected: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  // Estilos para o banner de login
  loginBanner: {
    backgroundColor: '#f0f8ff', // Azul claro
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  loginBannerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loginBannerIcon: {
    fontSize: 20,
  },
  loginBannerTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  loginBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  loginBannerDescription: {
    fontSize: 12,
    color: '#555',
  },
  loginBannerButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBannerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
