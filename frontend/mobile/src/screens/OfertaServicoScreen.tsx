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
  TouchableOpacity, // Para botões de status
  ListRenderItemInfo,
  RefreshControl, // Para pull-to-refresh na lista
  SectionList, // Para resolver o problema de nesting
  SectionListRenderItemInfo,
  NativeSyntheticEvent,
  TextInputChangeEventData,
  ScrollView,
  Switch
} from 'react-native';

// 1. Importações
import { useAuth } from "@/context/AuthContext";
import {
  fetchMyOffers as apiFetchMyOffers,
  createOffer as apiCreateOffer,
  fetchMyOfferById as apiFetchMyOfferById,
  updateOffer as apiUpdateOffer
} from '../services/api';
import { Offer, OfferData, OfferStatus, IDisponibilidade, IRecorrenciaSemanal, IHorarioDisponivel } from "@/types/offer"; // Tipos de Oferta
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props (sem parâmetros de rota agora)
type OfertaServicoScreenProps = NativeStackScreenProps<RootStackParamList, 'OfertaServico'>;


/**
 * Tela que permite ao prestador criar e gerenciar suas ofertas de serviço.
 * Usa as rotas do backend: /api/oferta (POST, GET)
 */
export default function OfertaServicoScreen({ navigation, route }: OfertaServicoScreenProps) {
  // 3. Obter usuário (para token) e parâmetros da rota
  const { user } = useAuth();

  // Verificar se estamos no modo de edição
  const isEditMode = route.params?.mode === 'edit';
  const editOfferId = isEditMode ? route.params?.offerId : null;

  // Função para formatar o preço no padrão brasileiro (R$ 1.234,56)
  const formatarPrecoParaBRL = (valor: string): string => {
    // Remove todos os caracteres não numéricos
    let numerico = valor.replace(/\D/g, '');

    // Se não houver números, retorna vazio
    if (numerico === '') return '';

    // Converte para centavos (inteiro)
    const centavos = parseInt(numerico, 10);

    // Formata o número: divide por 100 para obter o valor em reais
    // e usa toLocaleString para formatar com separadores brasileiros
    return (centavos / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para lidar com a mudança no campo de preço
  const handlePrecoChange = (text: string): void => {
    // Formata o texto inserido no padrão brasileiro
    const precoFormatado = formatarPrecoParaBRL(text);
    setPreco(precoFormatado);

    if (formTouched) {
      setPrecoError(validatePreco(precoFormatado));
    }
  };

  // 4. Tipar Estados
  // Estados do Formulário
  const [descricao, setDescricao] = useState<string>('');
  const [descricaoError, setDescricaoError] = useState<string | null>(null);

  const [preco, setPreco] = useState<string>(''); // Entrada é string
  const [precoError, setPrecoError] = useState<string | null>(null);

  // Inicializa com 'ready' para que novas ofertas sejam criadas como "Pronta" por padrão
  // Isso é crucial para garantir que as ofertas não sejam salvas como rascunho
  const [status, setStatus] = useState<OfferStatus>('ready');

  // Estado para disponibilidade estruturada
  const [disponibilidade, setDisponibilidade] = useState<IDisponibilidade>({
    recorrenciaSemanal: [],
    duracaoMediaMinutos: undefined,
    observacoes: ''
  });
  const [disponibilidadeError, setDisponibilidadeError] = useState<string | null>(null);

  // Estados para controlar a interface de disponibilidade
  const [showRecorrencia, setShowRecorrencia] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [tempHorario, setTempHorario] = useState<IHorarioDisponivel>({ inicio: '08:00', fim: '18:00' });

  const [isCreating, setIsCreating] = useState<boolean>(false); // Carregando para criação
  const [isLoadingOffer, setIsLoadingOffer] = useState<boolean>(false); // Carregando para carregamento da oferta em modo de edição
  const [formTouched, setFormTouched] = useState<boolean>(false); // Para mostrar erros apenas após interação
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null); // Armazena a oferta atual em modo de edição

  // Estados da Lista
  const [ofertas, setOfertas] = useState<Offer[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true); // Carregando para lista
  const [error, setError] = useState<string | null>(null);

  // 5. Refatorar fetchOfertas com melhor tratamento de erros
  const fetchOfertas = useCallback(async () => {
    if (!user?.token) {
      // Não deveria acontecer se a tela for protegida, mas é bom verificar
      setError("Autenticação necessária para ver ofertas.");
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    setError(null);
    try {
      // Passa o token para buscar apenas as ofertas do usuário logado
      // A função apiFetchMyOffers agora retorna { offers: [] } em caso de erro 404
      const response = await apiFetchMyOffers(user.token);

      // Verifica se a resposta contém ofertas
      if (response && Array.isArray(response.offers)) {
        // Log para diagnóstico do status das ofertas
        if (response.offers.length > 0) {
          console.log(`Encontradas ${response.offers.length} ofertas para este usuário.`);
          console.log('Status das ofertas:', response.offers.map(offer => ({
            id: offer._id,
            status: offer.status,
            descricao: offer.descricao.substring(0, 20) + (offer.descricao.length > 20 ? '...' : '')
          })));

          // Verificar se há ofertas com status 'ready'
          const readyOffers = response.offers.filter(offer => offer.status === 'ready');
          console.log(`Ofertas com status 'ready': ${readyOffers.length}`);

          // Verificar se há ofertas com status 'draft'
          const draftOffers = response.offers.filter(offer => offer.status === 'draft');
          console.log(`Ofertas com status 'draft': ${draftOffers.length}`);
        } else {
          console.log('Nenhuma oferta encontrada para este usuário.');
          // Não definimos erro aqui, pois lista vazia não é um erro
        }

        setOfertas(response.offers);
      } else {
        // Este caso não deve ocorrer com as melhorias na API, mas mantemos por segurança
        console.warn('Resposta da API não contém array de ofertas.');
        setOfertas([]);
      }
    } catch (err) {
      // Mesmo com as melhorias na API, ainda pode haver outros tipos de erros
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao buscar ofertas:', msg);
      setError(msg);
      // Não mostramos o Alert para não incomodar o usuário, apenas registramos o erro
      // e mostramos na interface de forma menos intrusiva
    } finally {
      setLoadingList(false);
    }
  }, [user?.token]); // Depende do token do usuário

  // Função para carregar os detalhes da oferta em modo de edição
  const fetchOfferDetails = useCallback(async () => {
    if (!isEditMode || !editOfferId || !user?.token) {
      return;
    }

    setIsLoadingOffer(true);
    setError(null);

    try {
      const response = await apiFetchMyOfferById(user.token, editOfferId);

      if (response && response.success && response.offer) {
        setCurrentOffer(response.offer);

        // Preencher os campos do formulário com os dados da oferta
        setDescricao(response.offer.descricao || '');

        // Formatar o preço para o formato brasileiro
        if (response.offer.preco !== undefined) {
          const precoFormatado = response.offer.preco.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          setPreco(precoFormatado);
        }

        // Definir o status
        setStatus(response.offer.status || 'ready');

        // Configurar a disponibilidade
        if (response.offer.disponibilidade) {
          if (typeof response.offer.disponibilidade === 'object') {
            const disp = response.offer.disponibilidade as IDisponibilidade;

            setDisponibilidade({
              recorrenciaSemanal: disp.recorrenciaSemanal || [],
              duracaoMediaMinutos: disp.duracaoMediaMinutos,
              observacoes: disp.observacoes || ''
            });

            // Configurar os dias selecionados para a interface
            if (disp.recorrenciaSemanal && disp.recorrenciaSemanal.length > 0) {
              setShowRecorrencia(true);
              setSelectedDays(disp.recorrenciaSemanal.map(rec => rec.diaSemana));
            }
          }
        }
      } else {
        setError(response?.message || 'Não foi possível carregar os detalhes da oferta');
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da oferta para edição');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao carregar detalhes da oferta:', msg);
      setError(msg);
      Alert.alert('Erro', `Erro ao carregar detalhes da oferta: ${msg}`);
    } finally {
      setIsLoadingOffer(false);
    }
  }, [isEditMode, editOfferId, user?.token]);

  // Carrega as ofertas ao montar ou quando o token mudar
  useEffect(() => {
    const loadOfertas = async () => {
      await fetchOfertas();
    };
    loadOfertas().catch(error => {
      console.error("Erro ao carregar ofertas:", error);
    });
  }, [fetchOfertas]);

  // Carrega os detalhes da oferta em modo de edição
  useEffect(() => {
    if (isEditMode && editOfferId) {
      fetchOfferDetails();
    }
  }, [isEditMode, editOfferId, fetchOfferDetails]);

  // Função para validar descrição
  const validateDescricao = (text: string): string | null => {
    if (!text.trim()) {
      return 'Descrição é obrigatória';
    } else if (text.trim().length < 10) {
      return 'Descrição deve ter pelo menos 10 caracteres';
    } else if (text.trim().length > 500) {
      return 'Descrição deve ter no máximo 500 caracteres';
    }
    return null;
  };

  // Função para validar preço
  const validatePreco = (text: string): string | null => {
    if (!text.trim()) {
      return 'Preço é obrigatório';
    }

    // Validação para formato brasileiro
    // Remove caracteres de formatação (R$, espaços, pontos de milhar)
    const precoLimpo = text.replace(/[^\d,]/g, '');

    if (precoLimpo.length === 0) {
      return 'Preço deve conter números';
    }

    // Verifica se há apenas uma vírgula
    const virgulas = precoLimpo.split(',');
    if (virgulas.length > 2) {
      return 'Formato de preço inválido. Use apenas uma vírgula como separador decimal';
    }

    // Verifica se o valor é maior que zero
    // Converte de formato brasileiro para número
    const valorNumerico = parseFloat(precoLimpo.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      return 'Preço deve ser maior que zero';
    }

    if (valorNumerico > 1000000) {
      return 'Preço máximo permitido é R$ 1.000.000,00';
    }

    return null;
  };

  // Função para validar disponibilidade estruturada
  const validateDisponibilidade = (disp: IDisponibilidade): string | null => {
    // Verifica se pelo menos um dos campos está preenchido
    const hasRecorrencia = disp.recorrenciaSemanal && disp.recorrenciaSemanal.length > 0;
    const hasDuracao = disp.duracaoMediaMinutos !== undefined && disp.duracaoMediaMinutos > 0;
    const hasObservacoes = disp.observacoes && disp.observacoes.trim().length > 0;

    if (!hasRecorrencia && !hasDuracao && !hasObservacoes) {
      return 'Preencha pelo menos um dos campos de disponibilidade';
    }

    // Validação específica para duração
    if (disp.duracaoMediaMinutos !== undefined) {
      if (isNaN(disp.duracaoMediaMinutos) || disp.duracaoMediaMinutos <= 0) {
        return 'Duração média deve ser um número positivo';
      }
      if (disp.duracaoMediaMinutos > 480) { // 8 horas como limite máximo
        return 'Duração média não deve exceder 480 minutos (8 horas)';
      }
    }

    // Validação para observações
    if (disp.observacoes && disp.observacoes.trim().length > 500) {
      return 'Observações devem ter no máximo 500 caracteres';
    }

    // Validação para recorrência semanal
    if (hasRecorrencia) {
      for (const recorrencia of disp.recorrenciaSemanal!) {
        // Verifica se o dia da semana é válido
        if (recorrencia.diaSemana < 0 || recorrencia.diaSemana > 6) {
          return 'Dia da semana inválido';
        }

        // Verifica se há horários definidos
        if (!recorrencia.horarios || recorrencia.horarios.length === 0) {
          return 'Adicione pelo menos um horário para cada dia selecionado';
        }

        // Verifica formato e validade dos horários
        for (const horario of recorrencia.horarios) {
          const regexHora = /^([01]\d|2[0-3]):([0-5]\d)$/; // Formato HH:MM (00:00 a 23:59)

          if (!regexHora.test(horario.inicio) || !regexHora.test(horario.fim)) {
            return 'Formato de horário inválido. Use HH:MM (ex: 08:30)';
          }

          // Verifica se hora final é posterior à inicial
          const [horaInicio, minInicio] = horario.inicio.split(':').map(Number);
          const [horaFim, minFim] = horario.fim.split(':').map(Number);

          const inicioEmMinutos = horaInicio * 60 + minInicio;
          const fimEmMinutos = horaFim * 60 + minFim;

          if (fimEmMinutos <= inicioEmMinutos) {
            return 'Hora final deve ser posterior à hora inicial';
          }
        }
      }
    }

    return null;
  };

  // Funções auxiliares para manipular disponibilidade

  // Adiciona um dia da semana à recorrência
  const addDayToRecorrencia = (diaSemana: number) => {
    if (selectedDays.includes(diaSemana)) return; // Evita duplicação

    setSelectedDays([...selectedDays, diaSemana]);

    // Adiciona o dia à recorrência semanal com horários vazios
    const novaRecorrencia: IRecorrenciaSemanal = {
      diaSemana,
      horarios: []
    };

    setDisponibilidade({
      ...disponibilidade,
      recorrenciaSemanal: [...(disponibilidade.recorrenciaSemanal || []), novaRecorrencia]
    });
  };

  // Remove um dia da semana da recorrência
  const removeDayFromRecorrencia = (diaSemana: number) => {
    setSelectedDays(selectedDays.filter(day => day !== diaSemana));

    setDisponibilidade({
      ...disponibilidade,
      recorrenciaSemanal: (disponibilidade.recorrenciaSemanal || []).filter(
        rec => rec.diaSemana !== diaSemana
      )
    });
  };

  // Adiciona um horário a um dia específico
  const addHorarioToDay = (diaSemana: number, horario: IHorarioDisponivel) => {
    const novaRecorrencia = [...(disponibilidade.recorrenciaSemanal || [])];
    const diaIndex = novaRecorrencia.findIndex(rec => rec.diaSemana === diaSemana);

    if (diaIndex >= 0) {
      novaRecorrencia[diaIndex] = {
        ...novaRecorrencia[diaIndex],
        horarios: [...novaRecorrencia[diaIndex].horarios, { ...horario }]
      };

      setDisponibilidade({
        ...disponibilidade,
        recorrenciaSemanal: novaRecorrencia
      });
    }
  };

  // Remove um horário de um dia específico
  const removeHorarioFromDay = (diaSemana: number, index: number) => {
    const novaRecorrencia = [...(disponibilidade.recorrenciaSemanal || [])];
    const diaIndex = novaRecorrencia.findIndex(rec => rec.diaSemana === diaSemana);

    if (diaIndex >= 0) {
      novaRecorrencia[diaIndex] = {
        ...novaRecorrencia[diaIndex],
        horarios: novaRecorrencia[diaIndex].horarios.filter((_, i) => i !== index)
      };

      setDisponibilidade({
        ...disponibilidade,
        recorrenciaSemanal: novaRecorrencia
      });
    }
  };

  // Atualiza a duração média
  const updateDuracaoMedia = (duracao: string) => {
    const duracaoNum = parseInt(duracao, 10);
    setDisponibilidade({
      ...disponibilidade,
      duracaoMediaMinutos: isNaN(duracaoNum) ? undefined : duracaoNum
    });
  };

  // Atualiza as observações
  const updateObservacoes = (text: string) => {
    setDisponibilidade({
      ...disponibilidade,
      observacoes: text
    });
  };

  // Função para validar todos os campos
  const validateForm = (): boolean => {
    setFormTouched(true);

    const descricaoErr = validateDescricao(descricao);
    const precoErr = validatePreco(preco);
    const disponibilidadeErr = validateDisponibilidade(disponibilidade);

    setDescricaoError(descricaoErr);
    setPrecoError(precoErr);
    setDisponibilidadeError(disponibilidadeErr);

    return !descricaoErr && !precoErr && !disponibilidadeErr;
  };

  // 6. Refatorar handleCreateOffer com melhor tratamento de erros e validação aprimorada
  const handleSubmitOffer = async () => {
    if (!user?.token) {
      Alert.alert('Erro', 'Autenticação necessária.');
      return;
    }

    // Validação completa do formulário
    if (!validateForm()) {
      Alert.alert('Erro de Validação', 'Por favor, corrija os erros no formulário antes de continuar.');
      return;
    }

    // Normalização do preço no formato brasileiro
    // Remove todos os caracteres não numéricos exceto a vírgula decimal
    let precoNormalizado = preco.trim();
    let precoNumero: number;

    try {
      // Remove caracteres de formatação (R$, espaços, pontos de milhar)
      // Mantém apenas dígitos e vírgula
      precoNormalizado = precoNormalizado.replace(/[^\d,]/g, '');

      // Substitui vírgula por ponto para conversão para número
      precoNormalizado = precoNormalizado.replace(',', '.');

      precoNumero = Number(precoNormalizado);

      if (isNaN(precoNumero)) {
        setPrecoError('Preço inválido. Use apenas números e vírgula como separador decimal.');
        Alert.alert('Erro de Validação', 'Preço inválido. Use apenas números e vírgula como separador decimal.');
        return;
      } else if (precoNumero <= 0) {
        setPrecoError('Preço deve ser maior que zero.');
        Alert.alert('Erro de Validação', 'Preço deve ser maior que zero.');
        return;
      } else if (precoNumero > 1000000) {
        setPrecoError('Preço máximo permitido é R$ 1.000.000,00.');
        Alert.alert('Erro de Validação', 'Preço máximo permitido é R$ 1.000.000,00.');
        return;
      }

      // Se chegou aqui, o preço é válido
      setPrecoError(null);
    } catch (error) {
      console.error('Erro ao processar preço:', error);
      setPrecoError('Erro ao processar o preço. Verifique o formato.');
      Alert.alert('Erro de Validação', 'Erro ao processar o preço. Verifique o formato.');
      return;
    }

    setIsCreating(true);

    // Prepara o objeto de disponibilidade para envio
    // Remove dias sem horários da recorrência semanal
    const recorrenciaFiltrada = disponibilidade.recorrenciaSemanal?.filter(
      rec => rec.horarios && rec.horarios.length > 0
    ) || [];

    // Cria o objeto de disponibilidade final
    const disponibilidadePayload: IDisponibilidade = {
      recorrenciaSemanal: recorrenciaFiltrada.length > 0 ? recorrenciaFiltrada : undefined,
      duracaoMediaMinutos: disponibilidade.duracaoMediaMinutos,
      observacoes: disponibilidade.observacoes?.trim() || undefined
    };

    // Remove campos undefined para evitar enviar dados desnecessários
    if (!disponibilidadePayload.recorrenciaSemanal) delete disponibilidadePayload.recorrenciaSemanal;
    if (!disponibilidadePayload.duracaoMediaMinutos) delete disponibilidadePayload.duracaoMediaMinutos;
    if (!disponibilidadePayload.observacoes) delete disponibilidadePayload.observacoes;

    // Garantir que o status seja explicitamente definido
    // Isso resolve o problema de ofertas sempre sendo salvas como rascunho
    const offerData: OfferData = {
      descricao: descricao.trim(),
      preco: precoNumero,
      status: status === 'draft' ? 'draft' : 'ready', // Força 'ready' a menos que seja explicitamente 'draft'
      disponibilidade: disponibilidadePayload,
    };

    console.log(`${isEditMode ? 'Atualizando' : 'Enviando'} oferta com status:`, offerData.status);

    try {
      let response;

      // Verifica se estamos no modo de edição ou criação
      if (isEditMode && editOfferId) {
        // Atualizar oferta existente
        response = await apiUpdateOffer(user.token, editOfferId, offerData);
      } else {
        // Criar nova oferta
        response = await apiCreateOffer(user.token, offerData);
      }

      // Verifica se a resposta indica sucesso
      if (response.success) {
        console.log(`Oferta ${isEditMode ? 'atualizada' : 'criada'} com sucesso. Resposta:`, response);

        // Mensagem de sucesso mais informativa
        const statusText = status === 'draft' ? 'rascunho' : 'pronta para publicação';
        const actionText = isEditMode ? 'atualizada' : 'criada';

        Alert.alert(
          'Sucesso', 
          `Oferta ${actionText} com sucesso como "${statusText}"! ${response.message || ''}`
        );

        // Se estiver no modo de edição, voltar para a tela anterior
        if (isEditMode) {
          navigation.goBack();
        } else {
          // Limpar formulário apenas se estiver criando uma nova oferta
          setDescricao('');
          setPreco('');
          setDisponibilidade({
            recorrenciaSemanal: [],
            duracaoMediaMinutos: undefined,
            observacoes: ''
          });
          setSelectedDays([]);
          setShowRecorrencia(false);
          // Mantém o status atual para facilitar a criação de múltiplas ofertas com o mesmo status
        }

        // Recarregar a lista de ofertas
        await fetchOfertas();

        // Verificar se a oferta foi realmente criada/atualizada com o status correto
        console.log('Lista de ofertas atualizada, verificando status das ofertas recentes');
      } else {
        // Este caso não deve ocorrer com as melhorias na API, mas mantemos por segurança
        console.warn(`Resposta da API indica falha ao ${isEditMode ? 'atualizar' : 'criar'} oferta:`, response);
        Alert.alert(
          'Aviso', 
          response.message || `Não foi possível confirmar se a oferta foi ${isEditMode ? 'atualizada' : 'criada'}. Verifique sua lista de ofertas.`
        );
      }
    } catch (err) {
      // Tratamento de erros melhorado com mensagens mais específicas
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`Erro ao ${isEditMode ? 'atualizar' : 'criar'} oferta:`, msg);

      // Verifica se é um erro de conexão
      if (msg.includes('Network') || msg.includes('timeout') || msg.includes('connection')) {
        Alert.alert(
          'Erro de Conexão', 
          'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
        );
      } 
      // Verifica se é um erro de validação do servidor
      else if (msg.includes('validação') || msg.includes('validation') || msg.includes('400')) {
        Alert.alert(
          'Erro de Validação', 
          msg.includes(':') ? msg.split(':')[1].trim() : 'Os dados fornecidos não são válidos. Verifique os campos e tente novamente.'
        );
      }
      // Verifica se é um erro de autenticação
      else if (msg.includes('autenticação') || msg.includes('authentication') || msg.includes('401') || msg.includes('403')) {
        Alert.alert(
          'Erro de Autenticação', 
          'Sua sessão pode ter expirado. Por favor, faça login novamente.'
        );
      }
      // Erro genérico com mais detalhes
      else {
        Alert.alert(
          `Erro ao ${isEditMode ? 'Atualizar' : 'Criar'} Oferta`, 
          'Ocorreu um erro ao processar sua solicitação. Detalhes: ' + msg
        );
      }
    } finally {
      setIsCreating(false);
    }
  };

  // 7. Tipar renderItem e keyExtractor com melhor tratamento de tipos
  const renderItem = ({ item }: ListRenderItemInfo<Offer>): React.ReactElement => {
    // Tratamento robusto para o campo disponibilidade que pode vir em diferentes formatos
    let disponibilidadeText = 'Disponível'; // Valor padrão

    if (item.disponibilidade !== undefined && item.disponibilidade !== null) {
      if (typeof item.disponibilidade === 'string') {
        disponibilidadeText = item.disponibilidade;
      } else if (typeof item.disponibilidade === 'object') {
        // Tenta extrair informações úteis do objeto estruturado
        try {
          const dispObj = item.disponibilidade as IDisponibilidade;
          const partes: string[] = [];

          // Adiciona informação sobre duração média
          if (dispObj.duracaoMediaMinutos) {
            partes.push(`Duração média: ${dispObj.duracaoMediaMinutos} min`);
          }

          // Adiciona informação sobre recorrência semanal
          if (dispObj.recorrenciaSemanal && dispObj.recorrenciaSemanal.length > 0) {
            const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const diasDisponiveis = dispObj.recorrenciaSemanal.map(rec => diasSemana[rec.diaSemana]);

            if (diasDisponiveis.length > 0) {
              partes.push(`Dias: ${diasDisponiveis.join(', ')}`);
            }
          }

          // Adiciona observações se existirem
          if (dispObj.observacoes) {
            partes.push(dispObj.observacoes);
          }

          // Monta o texto final
          if (partes.length > 0) {
            disponibilidadeText = partes.join(' | ');
          } else {
            disponibilidadeText = 'Disponível conforme agenda';
          }
        } catch (e) {
          console.warn('Erro ao processar disponibilidade:', e);
          disponibilidadeText = 'Disponível conforme agenda';
        }
      }
    }

    // Formata o status para exibição mais amigável
    const statusMap: Record<OfferStatus, string> = {
      'draft': 'Rascunho',
      'ready': 'Disponível',
      'inactive': 'Inativa',
      'archived': 'Arquivada'
    };

    const statusText = statusMap[item.status] || item.status;

    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.descricao}</Text>
        <Text style={styles.itemPrice}>
          R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <View style={styles.itemDetails}>
          <Text style={[styles.itemStatus, 
            item.status === 'ready' ? styles.statusReady : 
            item.status === 'draft' ? styles.statusDraft : 
            item.status === 'inactive' ? styles.statusInactive : 
            styles.statusArchived
          ]}>
            {statusText}
          </Text>
          <Text style={styles.itemDisponibilidade}>
            <Text style={styles.itemLabel}>Disponibilidade:</Text> {disponibilidadeText}
          </Text>
        </View>
      </View>
    );
  };

  const keyExtractor = (item: Offer): string => item._id;

  // Componente para lista vazia com mensagem mais informativa
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyListText}>Você ainda não criou nenhuma oferta.</Text>
      <Text style={styles.emptyListSubText}>
        Use o formulário acima para criar sua primeira oferta de serviço.
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchOfertas}
      >
        <Text style={styles.refreshButtonText}>Atualizar Lista</Text>
      </TouchableOpacity>
    </View>
  );

  // Função auxiliar para botões de status
  const renderStatusButton = (value: OfferStatus, title: string) => (
    <TouchableOpacity
      style={[styles.statusButton, status === value ? styles.statusButtonSelected : {}]}
      onPress={() => setStatus(value)}
      disabled={isCreating}
    >
      <Text style={[styles.statusButtonText, status === value ? styles.statusButtonTextSelected : {}]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Define um tipo de união para todos os possíveis tipos de itens nas seções
  type SectionItem = string | Offer;

  // Define o tipo para as seções
  type Section = {
    title: string;
    data: readonly SectionItem[];
    renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => React.ReactElement;
  };

  // Preparar as seções para o SectionList
  const sections: readonly Section[] = [
    {
      title: "Formulário",
      data: ["form"] as const,
      renderItem: () => (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{isEditMode ? "Editar Oferta" : "Criar Nova Oferta"}</Text>

          {isLoadingOffer && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Carregando dados da oferta...</Text>
            </View>
          )}
          <Text style={styles.label}>Descrição <Text style={styles.required}>*</Text></Text>
          <TextInput
            placeholder="Descrição detalhada do serviço"
            value={descricao}
            onChangeText={(text) => {
              setDescricao(text);
              if (formTouched) {
                setDescricaoError(validateDescricao(text));
              }
            }}
            style={[styles.input, descricaoError && formTouched ? styles.inputError : null]}
            editable={!isCreating}
            onBlur={() => {
              setFormTouched(true);
              setDescricaoError(validateDescricao(descricao));
            }}
            multiline={true}
            numberOfLines={3}
          />
          {descricaoError && formTouched && (
            <Text style={styles.errorText}>{descricaoError}</Text>
          )}

          <Text style={styles.label}>Preço (R$) <Text style={styles.required}>*</Text></Text>
          <TextInput
            placeholder="Ex: 150,00"
            value={preco}
            onChangeText={handlePrecoChange}
            keyboardType="numeric"
            style={[styles.input, precoError && formTouched ? styles.inputError : null]}
            editable={!isCreating}
            onBlur={() => {
              setFormTouched(true);
              setPrecoError(validatePreco(preco));
            }}
          />
          {precoError && formTouched && (
            <Text style={styles.errorText}>{precoError}</Text>
          )}

          <Text style={styles.label}>Disponibilidade <Text style={styles.required}>*</Text></Text>
          <View style={styles.disponibilidadeContainer}>
            {/* Duração média */}
            <View style={styles.duracaoContainer}>
              <Text style={styles.subLabel}>Duração média (minutos):</Text>
              <TextInput
                placeholder="Ex: 60"
                value={disponibilidade.duracaoMediaMinutos?.toString() || ''}
                onChangeText={(text) => {
                  updateDuracaoMedia(text);
                  if (formTouched) {
                    setDisponibilidadeError(validateDisponibilidade(disponibilidade));
                  }
                }}
                keyboardType="numeric"
                style={[styles.input, styles.duracaoInput]}
                editable={!isCreating}
                onBlur={() => {
                  setFormTouched(true);
                  setDisponibilidadeError(validateDisponibilidade(disponibilidade));
                }}
              />
            </View>

            {/* Observações */}
            <View style={styles.observacoesContainer}>
              <Text style={styles.subLabel}>Observações:</Text>
              <TextInput
                placeholder="Ex: Disponível apenas com agendamento prévio"
                value={disponibilidade.observacoes || ''}
                onChangeText={(text) => {
                  updateObservacoes(text);
                  if (formTouched) {
                    setDisponibilidadeError(validateDisponibilidade(disponibilidade));
                  }
                }}
                style={[styles.input, styles.observacoesInput]}
                multiline={true}
                numberOfLines={2}
                editable={!isCreating}
                onBlur={() => {
                  setFormTouched(true);
                  setDisponibilidadeError(validateDisponibilidade(disponibilidade));
                }}
              />
            </View>

            {/* Recorrência Semanal */}
            <View style={styles.recorrenciaContainer}>
              <View style={styles.recorrenciaHeader}>
                <Text style={styles.subLabel}>Recorrência Semanal:</Text>
                <Switch
                  value={showRecorrencia}
                  onValueChange={setShowRecorrencia}
                  disabled={isCreating}
                />
              </View>

              {showRecorrencia && (
                <View style={styles.recorrenciaContent}>
                  {/* Seleção de dias da semana */}
                  <Text style={styles.smallLabel}>Selecione os dias disponíveis:</Text>
                  <View style={styles.diasSemanaContainer}>
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.diaButton,
                          selectedDays.includes(index) && styles.diaButtonSelected
                        ]}
                        onPress={() => {
                          if (selectedDays.includes(index)) {
                            removeDayFromRecorrencia(index);
                          } else {
                            addDayToRecorrencia(index);
                          }
                          if (formTouched) {
                            setDisponibilidadeError(validateDisponibilidade(disponibilidade));
                          }
                        }}
                        disabled={isCreating}
                      >
                        <Text
                          style={[
                            styles.diaButtonText,
                            selectedDays.includes(index) && styles.diaButtonTextSelected
                          ]}
                        >
                          {dia}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Horários para os dias selecionados */}
                  {selectedDays.length > 0 && (
                    <View style={styles.horariosContainer}>
                      <Text style={styles.smallLabel}>Adicionar horários:</Text>

                      {/* Formulário para adicionar horário */}
                      <View style={styles.horarioInputContainer}>
                        <TextInput
                          placeholder="Início (HH:MM)"
                          value={tempHorario.inicio}
                          onChangeText={(text) => setTempHorario({...tempHorario, inicio: text})}
                          style={[styles.input, styles.horarioInput]}
                          editable={!isCreating}
                        />
                        <Text style={styles.horarioSeparator}>até</Text>
                        <TextInput
                          placeholder="Fim (HH:MM)"
                          value={tempHorario.fim}
                          onChangeText={(text) => setTempHorario({...tempHorario, fim: text})}
                          style={[styles.input, styles.horarioInput]}
                          editable={!isCreating}
                        />

                        {/* Dropdown para selecionar o dia */}
                        <View style={styles.diaSelectorContainer}>
                          <Text style={styles.smallLabel}>Para o dia:</Text>
                          <View style={styles.diaSelector}>
                            {selectedDays.map((diaSemana, index) => (
                              <TouchableOpacity
                                key={index}
                                style={styles.diaSelectorButton}
                                onPress={() => {
                                  // Validar horário antes de adicionar
                                  const regexHora = /^([01]\d|2[0-3]):([0-5]\d)$/;
                                  if (!regexHora.test(tempHorario.inicio) || !regexHora.test(tempHorario.fim)) {
                                    Alert.alert('Erro', 'Formato de horário inválido. Use HH:MM (ex: 08:30)');
                                    return;
                                  }

                                  const [horaInicio, minInicio] = tempHorario.inicio.split(':').map(Number);
                                  const [horaFim, minFim] = tempHorario.fim.split(':').map(Number);

                                  const inicioEmMinutos = horaInicio * 60 + minInicio;
                                  const fimEmMinutos = horaFim * 60 + minFim;

                                  if (fimEmMinutos <= inicioEmMinutos) {
                                    Alert.alert('Erro', 'Hora final deve ser posterior à hora inicial');
                                    return;
                                  }

                                  addHorarioToDay(diaSemana, {...tempHorario});
                                  if (formTouched) {
                                    setDisponibilidadeError(validateDisponibilidade(disponibilidade));
                                  }
                                }}
                              >
                                <Text style={styles.diaSelectorButtonText}>
                                  {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][diaSemana]}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>

                      {/* Lista de horários por dia */}
                      <ScrollView style={styles.horariosList}>
                        {disponibilidade.recorrenciaSemanal?.map((recorrencia, recIndex) => (
                          <View key={recIndex} style={styles.diaHorariosContainer}>
                            <Text style={styles.diaHorariosTitle}>
                              {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][recorrencia.diaSemana]}:
                            </Text>
                            {recorrencia.horarios.length > 0 ? (
                              recorrencia.horarios.map((horario, horIndex) => (
                                <View key={horIndex} style={styles.horarioItem}>
                                  <Text style={styles.horarioText}>
                                    {horario.inicio} - {horario.fim}
                                  </Text>
                                  <TouchableOpacity
                                    style={styles.removeHorarioButton}
                                    onPress={() => {
                                      removeHorarioFromDay(recorrencia.diaSemana, horIndex);
                                      if (formTouched) {
                                        setDisponibilidadeError(validateDisponibilidade(disponibilidade));
                                      }
                                    }}
                                    disabled={isCreating}
                                  >
                                    <Text style={styles.removeHorarioButtonText}>X</Text>
                                  </TouchableOpacity>
                                </View>
                              ))
                            ) : (
                              <Text style={styles.noHorariosText}>Nenhum horário adicionado</Text>
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {disponibilidadeError && formTouched && (
            <Text style={styles.errorText}>{disponibilidadeError}</Text>
          )}
          <Text style={styles.label}>Status Inicial *</Text>
          <View style={styles.statusButtonGroup}>
            {renderStatusButton('draft', 'Rascunho')}
            {renderStatusButton('ready', 'Pronta')}
          </View>
          <TouchableOpacity
            style={[
              styles.createButton,
              (isCreating || loadingList || isLoadingOffer) && styles.createButtonDisabled
            ]}
            onPress={handleSubmitOffer}
            disabled={isCreating || loadingList || isLoadingOffer}
          >
            <Text style={styles.createButtonText}>
              {isCreating 
                ? isEditMode ? "Atualizando..." : "Criando..." 
                : isEditMode ? "Atualizar Oferta" : "Criar Oferta"}
            </Text>
          </TouchableOpacity>

          {/* Mensagem de ajuda */}
          <Text style={styles.helpText}>
            Todos os campos marcados com <Text style={styles.required}>*</Text> são obrigatórios.
            Preencha corretamente para criar sua oferta de serviço.
          </Text>
        </View>
      )
    },
    {
      title: "Minhas Ofertas",
      data: loadingList 
        ? ["loading"] as const
        : error 
          ? ["error"] as const
          : ofertas.length > 0 
            ? ofertas as readonly SectionItem[]
            : ["empty"] as const,
      renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => {
        const item = info.item;

        if (item === "loading") {
          return (
            <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }}/>
          );
        }

        if (item === "error") {
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorMessageText}>
                {error?.includes('404') ? 
                  'Não foi possível conectar ao serviço de ofertas. Tente novamente mais tarde.' : 
                  `Erro ao carregar ofertas: ${error}`}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchOfertas}
              >
                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          );
        }

        if (item === "empty") {
          return renderEmptyList();
        }

        return renderItem({item: item as Offer} as ListRenderItemInfo<Offer>);
      }
    }
  ];

  // Adiciona um banner informativo sobre o status das ofertas
  const StatusInfoBanner = () => {
    // Só mostra o banner se houver ofertas
    if (ofertas.length === 0) return null;

    // Conta ofertas por status
    const readyCount = ofertas.filter(o => o.status === 'ready').length;
    const draftCount = ofertas.filter(o => o.status === 'draft').length;

    // Se todas as ofertas estão como rascunho, mostra um aviso
    if (draftCount > 0 && readyCount === 0) {
      return (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerText}>
            Atenção: Todas as suas ofertas estão como rascunho. 
            Para publicar, crie novas ofertas com status "Pronta".
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <StatusInfoBanner />
      <SectionList<SectionItem, Section>
        style={styles.screenContainer}
        sections={sections}
        keyExtractor={(item, index) => {
          if (typeof item === 'string') return item + index;
          return item._id || index.toString();
        }}
        renderSectionHeader={({section}) => (
          section.title === "Minhas Ofertas" ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.listTitle}>{section.title}</Text>
            </View>
          ) : null
        )}
        renderItem={(info) => info.section.renderItem(info)}
        refreshControl={
          <RefreshControl 
            refreshing={loadingList} 
            onRefresh={fetchOfertas}
            colors={['#0000ff']}
            tintColor="#0000ff"
          />
        }
        stickySectionHeadersEnabled={false}
        ListFooterComponent={() => <View style={{ height: 40 }} />}
      />
    </KeyboardAvoidingView>
  );
}

// 8. Estilos
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  formContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
    fontWeight: '500',
    flexDirection: 'row',
  },
  subLabel: {
    fontSize: 13,
    marginBottom: 3,
    color: '#555',
    fontWeight: '500',
  },
  smallLabel: {
    fontSize: 12,
    marginBottom: 3,
    color: '#666',
  },
  required: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 5, // Reduzido para dar espaço para mensagens de erro
    fontSize: 15,
    backgroundColor: '#fff',
    minHeight: 40,
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 1.5,
    backgroundColor: '#fff8f8',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  // Estilos para a seção de disponibilidade
  disponibilidadeContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  duracaoContainer: {
    marginBottom: 10,
  },
  duracaoInput: {
    width: '100%',
  },
  observacoesContainer: {
    marginBottom: 10,
  },
  observacoesInput: {
    width: '100%',
    minHeight: 60,
  },
  recorrenciaContainer: {
    marginTop: 5,
  },
  recorrenciaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recorrenciaContent: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  diasSemanaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  diaButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 8,
    marginRight: 5,
    minWidth: 40,
    alignItems: 'center',
  },
  diaButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  diaButtonText: {
    color: '#555',
    fontSize: 12,
  },
  diaButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  horariosContainer: {
    marginTop: 5,
  },
  horarioInputContainer: {
    marginBottom: 10,
  },
  horarioInput: {
    width: '48%',
    marginBottom: 8,
  },
  horarioSeparator: {
    textAlign: 'center',
    marginVertical: 5,
    color: '#666',
  },
  diaSelectorContainer: {
    marginTop: 5,
  },
  diaSelector: {
    flexDirection: 'column',
  },
  diaSelectorButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginBottom: 5,
  },
  diaSelectorButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  horariosList: {
    maxHeight: 200,
    marginTop: 10,
  },
  diaHorariosContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  diaHorariosTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  horarioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 5,
  },
  horarioText: {
    fontSize: 13,
  },
  removeHorarioButton: {
    backgroundColor: '#e74c3c',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeHorarioButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noHorariosText: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  statusButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  statusButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  statusButtonText: {
    color: '#555',
  },
  statusButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listSectionContainer: {
    padding: 20,
    flex: 1, // Para ocupar espaço se o form for pequeno
  },
  // Estilo adicional para o SectionList
  sectionHeader: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 8,
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
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  itemStatus: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
    marginRight: 8,
  },
  statusReady: {
    backgroundColor: '#2ecc71',
    color: 'white',
  },
  statusDraft: {
    backgroundColor: '#f39c12',
    color: 'white',
  },
  statusInactive: {
    backgroundColor: '#95a5a6',
    color: 'white',
  },
  statusArchived: {
    backgroundColor: '#7f8c8d',
    color: 'white',
  },
  itemDisponibilidade: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  itemLabel: {
    fontWeight: '500',
    color: '#333',
  },
  centerContainer: { // Para lista vazia
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorMessageText: {
    marginTop: 20,
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffdddd',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  createButtonDisabled: {
    backgroundColor: '#95a5a6',
    elevation: 0,
    shadowOpacity: 0,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Estilos para o banner de aviso
  warningBanner: {
    backgroundColor: '#f39c12',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e67e22',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  warningBannerText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
});
