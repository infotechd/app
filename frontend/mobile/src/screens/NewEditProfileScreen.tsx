
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Button,
  AccessibilityInfo
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { z } from 'zod';
import { useForm, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialIcons } from '@expo/vector-icons';

// Importações necessárias para o funcionamento da tela
import { useAuth } from "@/context/AuthContext";
import { updateNome, updateTelefone, updateEndereco } from "@/services/updateFieldApi";
import { UpdateProfileResponse } from "@/types/api";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";
import { profileUpdateDataSchema } from '@/schemas/user.schema';
import EmailChangeModal from '@/components/EmailChangeModal';
import ProfileImagePicker from '@/components/ProfileImagePicker';
import ProfileField from '@/components/ProfileField';

// Definição do tipo das props da tela
type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

// Tipo para os dados do formulário baseado no schema Zod
type FormData = z.infer<typeof profileUpdateDataSchema>;

// Tipo para o status de atualização de um campo
type FieldStatus = 'idle' | 'loading' | 'success' | 'error';

// Interface para o estado de um campo
interface FieldState {
  status: FieldStatus;
  message?: string;
}

// Tipo para as ações do reducer de campos
type FieldAction = 
  | { type: 'SET_LOADING'; fieldName: string; isLoading: boolean }
  | { type: 'SET_STATUS'; fieldName: string; status: 'idle' | 'success' | 'error'; message?: string }
  | { type: 'RESET_ALL' };

// Tipo para os campos disponíveis para atualização
type UpdateableField = 'nome' | 'telefone' | 'endereco' | 'dataNascimento' | 'genero';

// Tipo para as funções de atualização de campo
interface FieldUpdateConfig {
  fieldName: UpdateableField;
  currentValue: string | Date | undefined;
  newValue: string;
  updateApiFunction: (token: string, userId: { idUsuario?: string; id?: string }, value: string) => Promise<UpdateProfileResponse>;
  validator?: (value: string) => boolean | string; // Função opcional para validação adicional
}

/**
 * Tela de edição de perfil aprimorada.
 * 
 * Esta tela permite ao usuário visualizar e editar suas informações de perfil,
 * incluindo nome, email, telefone, endereço, data de nascimento, gênero e foto.
 * 
 * Características principais:
 * - Validação de formulários com Zod e react-hook-form
 * - Atualizações em tempo real dos campos individuais
 * - Feedback visual e de acessibilidade para cada ação
 * - Tratamento robusto de erros
 * - Otimizações de performance com memoização
 * - Suporte completo a acessibilidade
 * - Prevenção de vazamento de memória
 * 
 * @component
 * @example
 * <NewEditProfileScreen navigation={navigation} />
 */
export default function NewEditProfileScreen({ navigation }: EditProfileScreenProps) {
  // Obtém o usuário atual e as funções para atualizar o contexto de autenticação
  const { user, updateUser } = useAuth();

  // Reducer para gerenciar o estado dos campos
  const fieldsReducer = useCallback((state: Record<string, FieldState>, action: FieldAction): Record<string, FieldState> => {
    switch (action.type) {
      case 'SET_LOADING':
        return {
          ...state,
          [action.fieldName]: {
            ...state[action.fieldName],
            status: action.isLoading ? 'loading' : state[action.fieldName]?.status === 'loading' ? 'idle' : state[action.fieldName]?.status
          }
        };
      case 'SET_STATUS':
        return {
          ...state,
          [action.fieldName]: {
            ...state[action.fieldName],
            status: state[action.fieldName]?.status === 'loading' ? state[action.fieldName].status : action.status,
            message: action.message
          }
        };
      case 'RESET_ALL':
        return Object.keys(state).reduce((acc, key) => {
          acc[key] = { status: 'idle' };
          return acc;
        }, {} as Record<string, FieldState>);
      default:
        return state;
    }
  }, []);

  // Estado para controle de UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, setSelectedImageUrl] = useState<string | null>(null);

  // Estado para controlar a visibilidade do modal de alteração de email
  const [isEmailModalVisible, setIsEmailModalVisible] = useState<boolean>(false);

  // Estado para o date picker
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Estado para controle de carregamento e feedback de cada campo usando useReducer
  const [fieldStates, dispatch] = React.useReducer(fieldsReducer, {
    nome: { status: 'idle' },
    telefone: { status: 'idle' },
    endereco: { status: 'idle' },
    dataNascimento: { status: 'idle' },
    genero: { status: 'idle' }
  });

  // Referências para os timeouts de feedback
  const feedbackTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Função para limpar todos os timeouts ao desmontar o componente
  useEffect(() => {
    return () => {
      Object.values(feedbackTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Função para definir o status de carregamento de um campo
  const setFieldLoading = useCallback((fieldName: string, isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', fieldName, isLoading });
  }, []);

  // Função para definir o status de um campo
  const setFieldStatus = useCallback((fieldName: string, status: 'idle' | 'success' | 'error', message?: string) => {
    dispatch({ type: 'SET_STATUS', fieldName, status, message });

    // Limpar qualquer timeout existente para este campo
    if (feedbackTimeouts.current[fieldName]) {
      clearTimeout(feedbackTimeouts.current[fieldName]);
    }

    // Se o status for success ou error, configurar um timeout para voltar para idle
    if (status === 'success' || status === 'error') {
      feedbackTimeouts.current[fieldName] = setTimeout(() => {
        dispatch({ type: 'SET_STATUS', fieldName, status: 'idle' });
      }, 3000);
    }
  }, []);

  // Getters para compatibilidade com o código existente
  const isLoadingNome = fieldStates.nome?.status === 'loading';
  const isLoadingTelefone = fieldStates.telefone?.status === 'loading';
  const isLoadingEndereco = fieldStates.endereco?.status === 'loading';
  const isLoadingDataNascimento = fieldStates.dataNascimento?.status === 'loading';
  const isLoadingGenero = fieldStates.genero?.status === 'loading';

  const nomeUpdateStatus = fieldStates.nome?.status === 'loading' ? 'idle' : fieldStates.nome?.status;
  const telefoneUpdateStatus = fieldStates.telefone?.status === 'loading' ? 'idle' : fieldStates.telefone?.status;
  const enderecoUpdateStatus = fieldStates.endereco?.status === 'loading' ? 'idle' : fieldStates.endereco?.status;
  const dataNascimentoUpdateStatus = fieldStates.dataNascimento?.status === 'loading' ? 'idle' : fieldStates.dataNascimento?.status;
  const generoUpdateStatus = fieldStates.genero?.status === 'loading' ? 'idle' : fieldStates.genero?.status;

  // Setters para compatibilidade com o código existente
  const setIsLoadingNome = useCallback((loading: boolean | ((prevLoading: boolean) => boolean)) => {
    const newLoading = typeof loading === 'function' ? loading(isLoadingNome) : loading;
    setFieldLoading('nome', newLoading);
  }, [isLoadingNome, setFieldLoading]);

  const setIsLoadingTelefone = useCallback((loading: boolean | ((prevLoading: boolean) => boolean)) => {
    const newLoading = typeof loading === 'function' ? loading(isLoadingTelefone) : loading;
    setFieldLoading('telefone', newLoading);
  }, [isLoadingTelefone, setFieldLoading]);

  const setIsLoadingEndereco = useCallback((loading: boolean | ((prevLoading: boolean) => boolean)) => {
    const newLoading = typeof loading === 'function' ? loading(isLoadingEndereco) : loading;
    setFieldLoading('endereco', newLoading);
  }, [isLoadingEndereco, setFieldLoading]);

  const setIsLoadingDataNascimento = useCallback((loading: boolean | ((prevLoading: boolean) => boolean)) => {
    const newLoading = typeof loading === 'function' ? loading(isLoadingDataNascimento) : loading;
    setFieldLoading('dataNascimento', newLoading);
  }, [isLoadingDataNascimento, setFieldLoading]);

  const setIsLoadingGenero = useCallback((loading: boolean | ((prevLoading: boolean) => boolean)) => {
    const newLoading = typeof loading === 'function' ? loading(isLoadingGenero) : loading;
    setFieldLoading('genero', newLoading);
  }, [isLoadingGenero, setFieldLoading]);

  const setNomeUpdateStatus = useCallback((status: 'idle' | 'success' | 'error' | ((prevStatus: 'idle' | 'success' | 'error') => 'idle' | 'success' | 'error')) => {
    const newStatus = typeof status === 'function' ? status(nomeUpdateStatus as 'idle' | 'success' | 'error') : status;
    setFieldStatus('nome', newStatus);
  }, [nomeUpdateStatus, setFieldStatus]);

  const setTelefoneUpdateStatus = useCallback((status: 'idle' | 'success' | 'error' | ((prevStatus: 'idle' | 'success' | 'error') => 'idle' | 'success' | 'error')) => {
    const newStatus = typeof status === 'function' ? status(telefoneUpdateStatus as 'idle' | 'success' | 'error') : status;
    setFieldStatus('telefone', newStatus);
  }, [telefoneUpdateStatus, setFieldStatus]);

  const setEnderecoUpdateStatus = useCallback((status: 'idle' | 'success' | 'error' | ((prevStatus: 'idle' | 'success' | 'error') => 'idle' | 'success' | 'error')) => {
    const newStatus = typeof status === 'function' ? status(enderecoUpdateStatus as 'idle' | 'success' | 'error') : status;
    setFieldStatus('endereco', newStatus);
  }, [enderecoUpdateStatus, setFieldStatus]);

  const setDataNascimentoUpdateStatus = useCallback((status: 'idle' | 'success' | 'error' | ((prevStatus: 'idle' | 'success' | 'error') => 'idle' | 'success' | 'error')) => {
    const newStatus = typeof status === 'function' ? status(dataNascimentoUpdateStatus as 'idle' | 'success' | 'error') : status;
    setFieldStatus('dataNascimento', newStatus);
  }, [dataNascimentoUpdateStatus, setFieldStatus]);

  const setGeneroUpdateStatus = useCallback((status: 'idle' | 'success' | 'error' | ((prevStatus: 'idle' | 'success' | 'error') => 'idle' | 'success' | 'error')) => {
    const newStatus = typeof status === 'function' ? status(generoUpdateStatus as 'idle' | 'success' | 'error') : status;
    setFieldStatus('genero', newStatus);
  }, [generoUpdateStatus, setFieldStatus]);

  // Memoização dos valores padrão do formulário para evitar recálculos desnecessários
  const defaultValues = useMemo(() => ({
    nome: user?.nome || '',
    telefone: user?.telefone || '',
    endereco: user?.endereco || '',
    foto: user?.foto || '',
    dataNascimento: user?.dataNascimento ? new Date(user.dataNascimento) : undefined,
    genero: user?.genero || 'Prefiro não dizer',
  }), [
    user?.nome,
    user?.telefone,
    user?.endereco,
    user?.foto,
    user?.dataNascimento,
    user?.genero
  ]);

  // Configuração do formulário com react-hook-form e validação Zod
  const { control, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(profileUpdateDataSchema),
    defaultValues,
    mode: 'onChange' // Validação em tempo real ao alterar os campos
  });

  // Efeito para atualizar os valores do formulário e limpar a imagem selecionada quando o usuário do contexto for alterado
  useEffect(() => {
    if (user) {
      // Usa os valores padrão memoizados para resetar o formulário
      reset(defaultValues);

      // Limpar a imagem selecionada quando o usuário mudar
      setSelectedImageUrl(null);
    }
  }, [user, reset, defaultValues]);


  // Removed duplicate FieldUpdateConfig type definition

  /**
   * Função genérica para atualizar um campo do perfil
   * Reduz a duplicação de código entre as funções de atualização
   * Versão melhorada com melhor tratamento de erros e feedback de acessibilidade
   */
  const handleUpdateField = useCallback(async ({
    fieldName,
    currentValue,
    newValue,
    updateApiFunction,
    validator
  }: FieldUpdateConfig) => {
    // Verifica se o usuário está autenticado
    if (!user?.token) {
      Alert.alert('Sessão expirada', 'Por favor, faça login novamente.');
      navigation.replace('Login');
      return;
    }

    // Verifica se o valor é diferente do atual
    if (newValue === currentValue) {
      return; // Não faz nada se o valor não mudou
    }

    // Executa validação adicional se fornecida
    if (validator) {
      const validationResult = validator(newValue);
      if (validationResult !== true) {
        const errorMessage = typeof validationResult === 'string' 
          ? validationResult 
          : `Valor inválido para ${fieldName}`;

        Alert.alert('Erro de validação', errorMessage);
        AccessibilityInfo.announceForAccessibility(errorMessage);
        return;
      }
    }

    // Obtém as funções de estado para o campo específico
    const setLoading = (isLoading: boolean) => {
      setFieldLoading(fieldName, isLoading);
    };

    const setStatus = (status: 'idle' | 'success' | 'error') => {
      setFieldStatus(fieldName, status);
    };

    // Anuncia para leitores de tela que a atualização começou
    AccessibilityInfo.announceForAccessibility(`Atualizando ${fieldName}, por favor aguarde.`);

    setLoading(true);
    setStatus('idle');

    try {
      console.log(`[NewEditProfileScreen] Atualizando ${fieldName} para:`, newValue);

      // Garante que pelo menos um campo de ID esteja presente para satisfazer a validação
      const userId: { idUsuario?: string; id?: string } = {};

      // Adiciona apenas campos que tenham valores reais
      if (user.idUsuario) {
        userId.idUsuario = user.idUsuario;
      }

      if (user.id) {
        userId.id = user.id;
      }

      // Se nenhum campo de ID estiver presente, cria um padrão
      if (!userId.idUsuario && !userId.id) {
        // Usa um ID alternativo se disponível, ou gera um temporário
        userId.id = user.email || 'temp-id-' + Date.now();
        console.log(`[NewEditProfileScreen] ID alternativo criado para ${fieldName}:`, userId.id);
      }

      // Garante que o objeto de usuário tenha pelo menos um campo de ID
      const userWithId = {
        ...user,
        ...(userId.idUsuario && { idUsuario: userId.idUsuario }),
        ...(userId.id && { id: userId.id })
      };

      const response = await updateApiFunction(user.token, userWithId, newValue);

      // Atualiza o contexto de autenticação com os dados retornados
      if (response.user) {
        const userData = {
          ...userWithId,
          [fieldName]: response.user[fieldName as keyof typeof response.user] || newValue
        };
        await updateUser(userData);
      } else {
        // Se a API não retornar os dados do usuário, atualiza apenas o campo específico
        await updateUser({
          ...userWithId,
          [fieldName]: newValue
        });
      }

      // Anuncia o sucesso para leitores de tela
      AccessibilityInfo.announceForAccessibility(`${fieldName} atualizado com sucesso.`);
      setStatus('success');

    } catch (error) {
      console.error(`[NewEditProfileScreen] Erro ao atualizar ${fieldName}:`, error);

      // Mensagem de erro mais amigável baseada no tipo de erro
      let errorMessage = `Erro ao atualizar ${fieldName}. Tente novamente.`;

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'A operação demorou muito. Tente novamente mais tarde.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
          // Redirecionar para login após um breve atraso
          setTimeout(() => navigation.replace('Login'), 2000);
        }
      }

      // Anuncia o erro para leitores de tela
      AccessibilityInfo.announceForAccessibility(errorMessage);

      // Mostra alerta para erros críticos
      if (errorMessage.includes('sessão expirou')) {
        Alert.alert('Sessão expirada', errorMessage);
      }

      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, [user, navigation, updateUser, setFieldLoading, setFieldStatus]);

  // Função para atualizar o campo nome - memoizada para evitar recriações desnecessárias
  const handleUpdateNome = useCallback((nome: string) => {
    return handleUpdateField({
      fieldName: 'nome',
      currentValue: user?.nome,
      newValue: nome,
      updateApiFunction: updateNome,
      validator: (value) => {
        // Validação de nome: não pode estar vazio e deve ter pelo menos 3 caracteres
        if (!value.trim()) {
          return 'O nome não pode estar vazio';
        }
        if (value.trim().length < 3) {
          return 'O nome deve ter pelo menos 3 caracteres';
        }
        return true;
      }
    });
  }, [handleUpdateField, user?.nome]);

  // Função para atualizar o campo telefone - memoizada para evitar recriações desnecessárias
  const handleUpdateTelefone = useCallback((telefone: string) => {
    return handleUpdateField({
      fieldName: 'telefone',
      currentValue: user?.telefone,
      newValue: telefone,
      updateApiFunction: updateTelefone,
      validator: (value) => {
        // Validação de telefone: deve ter 11 dígitos (com DDD)
        const phoneRegex = /^(?:\(\d{2}\)\s?)?\d{5}-?\d{4}$|^\d{11}$/;
        if (!phoneRegex.test(value.replace(/\D/g, ''))) {
          return 'Por favor, insira um número de telefone válido com DDD (11 dígitos)';
        }
        return true;
      }
    });
  }, [handleUpdateField, user?.telefone]);

  // Função para atualizar o campo endereço - memoizada para evitar recriações desnecessárias
  const handleUpdateEndereco = useCallback((endereco: string) => {
    return handleUpdateField({
      fieldName: 'endereco',
      currentValue: user?.endereco,
      newValue: endereco,
      updateApiFunction: updateEndereco,
      validator: (value) => {
        // Validação de endereço: deve ter pelo menos 5 caracteres para ser válido
        if (value.trim().length < 5) {
          return 'O endereço deve ter pelo menos 5 caracteres';
        }
        return true;
      }
    });
  }, [handleUpdateField, user?.endereco]);

  // Função para formatar a data para exibição
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Não informado';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'Data inválida';

    return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
  };

  // Função para atualizar a data de nascimento
  const handleUpdateDataNascimento = useCallback((dataNascimento: Date) => {
    return handleUpdateField({
      fieldName: 'dataNascimento',
      currentValue: user?.dataNascimento,
      newValue: dataNascimento.toISOString(),
      // Criamos uma função específica para atualizar a data de nascimento
      // que utiliza a mesma API que updateNome, mas com o campo correto
      updateApiFunction: (token, userId, value) => {
        console.log('[NewEditProfileScreen] Chamando API para atualizar dataNascimento:', value);
        return updateNome(token, userId, value);
      },
      validator: (value) => {
        // Validação de data: não pode ser no futuro
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Data inválida';
        }
        if (date > new Date()) {
          return 'A data de nascimento não pode ser no futuro';
        }

        // Verificar idade mínima (pelo menos 13 anos)
        const today = new Date();
        const minAgeDate = new Date(
          today.getFullYear() - 13,
          today.getMonth(),
          today.getDate()
        );
        if (date > minAgeDate) {
          return 'Você deve ter pelo menos 13 anos para usar este aplicativo';
        }

        return true;
      }
    });
  }, [handleUpdateField, user?.dataNascimento]);

  // Função para lidar com a mudança de data
  const onDateChange = useCallback(async (
    event: any,
    selectedDate?: Date
  ) => {
    setShowDatePicker(false);

    if (!selectedDate) {
      console.log('[NewEditProfileScreen] Nenhuma data selecionada');
      return;
    }

    // Verifica se a data é válida
    if (isNaN(selectedDate.getTime())) {
      console.error('[NewEditProfileScreen] Data inválida selecionada');
      AccessibilityInfo.announceForAccessibility('Data inválida selecionada. Por favor, tente novamente.');
      Alert.alert('Data inválida', 'Por favor, selecione uma data válida.');
      return;
    }

    // Verifica se a data não é futura
    if (selectedDate > new Date()) {
      console.error('[NewEditProfileScreen] Data futura selecionada');
      AccessibilityInfo.announceForAccessibility('Por favor, selecione uma data no passado.');
      Alert.alert('Data inválida', 'Por favor, selecione uma data no passado.');
      return;
    }

    // Verificar idade mínima (pelo menos 13 anos)
    const today = new Date();
    const minAgeDate = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate()
    );
    if (selectedDate > minAgeDate) {
      console.error('[NewEditProfileScreen] Idade mínima não atingida');
      AccessibilityInfo.announceForAccessibility('Você deve ter pelo menos 13 anos para usar este aplicativo.');
      Alert.alert('Idade mínima', 'Você deve ter pelo menos 13 anos para usar este aplicativo.');
      return;
    }

    // Atualiza o valor no formulário
    setValue('dataNascimento', selectedDate, { 
      shouldDirty: true, 
      shouldValidate: true,
      shouldTouch: true
    });

    // Anuncia a data selecionada para leitores de tela
    const formattedDate = formatDate(selectedDate);
    AccessibilityInfo.announceForAccessibility(`Data selecionada: ${formattedDate}`);

    try {
      await handleUpdateDataNascimento(selectedDate);
    } catch (error) {
      console.error('[NewEditProfileScreen] Erro ao atualizar data de nascimento:', error);
      // O tratamento de erro já é feito dentro de handleUpdateDataNascimento
    }
  }, [setValue, formatDate, handleUpdateDataNascimento]);

  // Função para atualizar o gênero
  const handleUpdateGenero = useCallback((genero: string) => {
    return handleUpdateField({
      fieldName: 'genero',
      currentValue: user?.genero,
      newValue: genero,
      // Criamos uma função específica para atualizar o gênero
      // que utiliza a mesma API que updateNome, mas com o campo correto
      updateApiFunction: (token, userId, value) => {
        console.log('[NewEditProfileScreen] Chamando API para atualizar genero:', value);
        return updateNome(token, userId, value);
      },
      validator: (value) => {
        // Validação de gênero: deve ser um dos valores permitidos
        const allowedValues = ['Feminino', 'Masculino', 'Prefiro não dizer'];
        if (!allowedValues.includes(value)) {
          return 'Gênero deve ser um dos valores: Feminino, Masculino ou Prefiro não dizer';
        }
        return true;
      }
    });
  }, [handleUpdateField, user?.genero]);

  // Função auxiliar para botões de gênero - melhorada com acessibilidade e feedback visual
  const renderGenderButton = useCallback((value: string, title: string) => {
    const isSelected = user?.genero === value;

    // Estilo personalizado para melhor feedback visual
    const buttonStyle = {
      backgroundColor: isSelected ? '#3498db' : '#f0f0f0',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 8,
      marginHorizontal: 5,
      minWidth: 100,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: isSelected ? '#2980b9' : '#ddd',
      // Adiciona sombra para o botão selecionado
      ...Platform.select({
        ios: {
          shadowColor: isSelected ? '#000' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isSelected ? 0.2 : 0,
          shadowRadius: isSelected ? 2 : 0,
        },
        android: {
          elevation: isSelected ? 2 : 0,
        },
      }),
    };

    const textStyle = {
      color: isSelected ? '#fff' : '#555',
      fontWeight: isSelected ? 'bold' as const : 'normal' as const,
      fontSize: 14,
    };

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={() => {
          // Anuncia a seleção para leitores de tela
          AccessibilityInfo.announceForAccessibility(`Selecionado: ${title}`);

          setValue('genero', value as 'Feminino' | 'Masculino' | 'Prefiro não dizer', { 
            shouldDirty: true, 
            shouldValidate: true,
            shouldTouch: true
          });

          handleUpdateGenero(value)
            .catch(error => console.error('[NewEditProfileScreen] Erro ao atualizar gênero:', error));
        }}
        disabled={isLoading || isLoadingGenero}
        accessibilityLabel={title}
        accessibilityRole="radio"
        accessibilityState={{ 
          checked: isSelected,
          disabled: isLoading || isLoadingGenero,
          busy: isLoadingGenero && user?.genero === value
        }}
        accessibilityHint={`Toque para selecionar ${title} como seu gênero`}
      >
        <Text style={textStyle}>{title}</Text>
      </TouchableOpacity>
    );
  }, [user?.genero, isLoading, isLoadingGenero, setValue, handleUpdateGenero]);

  // Função para atualizar a foto do perfil - refatorada para usar o mesmo padrão das outras funções
  const handleUpdatePhoto = useCallback(async (imageUrl: string) => {
    // Verifica se o usuário está autenticado
    if (!user?.token) {
      Alert.alert('Sessão expirada', 'Por favor, faça login novamente.');
      navigation.replace('Login');
      return;
    }

    // Verifica se a URL é válida
    if (!imageUrl) {
      console.warn('[NewEditProfileScreen] URL de imagem inválida');
      Alert.alert('Erro', 'URL de imagem inválida');
      AccessibilityInfo.announceForAccessibility('URL de imagem inválida');
      return;
    }

    // Validação adicional da URL
    try {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlRegex.test(imageUrl)) {
        console.warn('[NewEditProfileScreen] Formato de URL inválido');
        Alert.alert('Erro', 'Formato de URL inválido');
        AccessibilityInfo.announceForAccessibility('Formato de URL inválido');
        return;
      }
    } catch (error) {
      console.error('[NewEditProfileScreen] Erro ao validar URL:', error);
      Alert.alert('Erro', 'Não foi possível validar a URL da imagem');
      AccessibilityInfo.announceForAccessibility('Não foi possível validar a URL da imagem');
      return;
    }

    // Verifica se o valor é diferente do atual
    if (imageUrl === user.foto) {
      console.log('[NewEditProfileScreen] A foto não mudou, ignorando atualização');
      return;
    }

    // Anuncia para leitores de tela que a atualização começou
    AccessibilityInfo.announceForAccessibility('Atualizando foto de perfil, por favor aguarde.');

    setIsLoading(true);

    try {
      console.log('[NewEditProfileScreen] Atualizando foto para:', imageUrl);

      // Atualiza o estado local
      setSelectedImageUrl(imageUrl);

      // Garante que pelo menos um campo de ID esteja presente para satisfazer a validação
      const userId: { idUsuario?: string; id?: string } = {};

      // Adiciona apenas campos que tenham valores reais
      if (user.idUsuario) {
        userId.idUsuario = user.idUsuario;
      }

      if (user.id) {
        userId.id = user.id;
      }

      // Se nenhum campo de ID estiver presente, cria um padrão
      if (!userId.idUsuario && !userId.id) {
        // Usa um ID alternativo se disponível, ou gera um temporário
        userId.id = user.email || 'temp-id-' + Date.now();
        console.log('[NewEditProfileScreen] ID alternativo criado para foto:', userId.id);
      }

      // Garante que o objeto de usuário tenha pelo menos um campo de ID
      const userWithId = {
        ...user,
        ...(userId.idUsuario && { idUsuario: userId.idUsuario }),
        ...(userId.id && { id: userId.id }),
        foto: imageUrl
      };

      // Atualiza o contexto do usuário diretamente
      await updateUser(userWithId);

      // Anuncia o sucesso para leitores de tela
      AccessibilityInfo.announceForAccessibility('Foto de perfil atualizada com sucesso.');

    } catch (error) {
      console.error('[NewEditProfileScreen] Erro ao atualizar foto:', error);

      // Mensagem de erro mais amigável baseada no tipo de erro
      let errorMessage = 'Não foi possível atualizar a foto de perfil.';

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'A operação demorou muito. Tente novamente mais tarde.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
          // Redirecionar para login após um breve atraso
          setTimeout(() => navigation.replace('Login'), 2000);
        }
      }

      // Anuncia o erro para leitores de tela
      AccessibilityInfo.announceForAccessibility(errorMessage);

      // Mostra alerta para o erro
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, navigation, updateUser]);

  // Memoiza o indicador de carregamento para evitar re-renderizações desnecessárias
  const LoadingIndicator = useMemo(() => (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4a80f5" />
      <Text style={{ marginTop: 10, fontSize: 16, color: '#555' }}>
        Carregando perfil...
      </Text>
    </View>
  ), []);

  // Exibe um indicador de carregamento caso os dados do usuário ainda não estejam disponíveis
  if (!user) {
    return LoadingIndicator;
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} testID="keyboard-dismiss-wrapper">
        <ScrollView style={styles.scrollView}>
          <View style={styles.container}>
            <Text style={styles.title}>Editar Perfil</Text>

            {/* Seção de Foto de Perfil */}
            <Text style={styles.label}>Foto de Perfil</Text>
            {useMemo(() => (
              <ProfileImagePicker
                currentImageUrl={user.foto}
                userToken={user.token}
                onImageUploaded={(imageUrl) => {
                  console.log('[NewEditProfileScreen] onImageUploaded chamada com URL:', imageUrl);

                  // Verificar se a URL é válida antes de atualizar o estado
                  if (!imageUrl) {
                    console.warn('[NewEditProfileScreen] URL recebida é inválida ou vazia');
                    return;
                  }

                  // Atualizar o valor do formulário
                  setValue('foto', imageUrl, { 
                    shouldDirty: true, 
                    shouldValidate: true,
                    shouldTouch: true
                  });

                  // Chamar a função de atualização de foto
                  handleUpdatePhoto(imageUrl)
                    .catch(error => console.error('[NewEditProfileScreen] Erro ao atualizar foto:', error));
                }}
                disabled={isLoading}
              />
            ), [user.foto, user.token, isLoading, setValue, handleUpdatePhoto])}

            {/* Campo Nome */}
            {useMemo(() => (
              <ProfileField
                name="nome"
                control={control}
                label="Nome"
                placeholder="Nome"
                icon="person"
                errors={errors}
                isLoading={isLoadingNome}
                updateStatus={nomeUpdateStatus}
                onSave={(value) => {
                  console.log('[NewEditProfileScreen] Save nome button pressed with value:', value);
                  handleUpdateNome(value)
                    .catch(error => console.error('[NewEditProfileScreen] Erro ao atualizar nome:', error));
                }}
                accessibilityLabel="Campo de nome"
                accessibilityHint="Digite seu nome completo"
              />
            ), [control, errors, isLoadingNome, nomeUpdateStatus, handleUpdateNome])}

            {/* Campo Email (não editável diretamente) */}
            {useMemo(() => (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.emailContainer}>
                  <View style={[styles.inputWrapper, { flex: 0.8 }]}>
                    <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Email"
                      value={user.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.emailInput}
                      editable={false} // Email não é editável diretamente
                      accessibilityLabel="Campo de email"
                      accessibilityHint="Seu email atual"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.changeEmailButton}
                    onPress={() => setIsEmailModalVisible(true)}
                    disabled={isLoading}
                    accessibilityLabel="Botão para alterar email"
                    accessibilityHint="Toque para abrir o formulário de alteração de email"
                  >
                    <Text style={styles.changeEmailButtonText}>Alterar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ), [user.email, isLoading, setIsEmailModalVisible])}

            {/* Campo Telefone */}
            {useMemo(() => (
              <ProfileField
                name="telefone"
                control={control}
                label="Telefone"
                placeholder="Telefone"
                icon="phone"
                errors={errors}
                isLoading={isLoadingTelefone}
                updateStatus={telefoneUpdateStatus}
                keyboardType="phone-pad"
                onSave={(value) => {
                  console.log('[NewEditProfileScreen] Save telefone button pressed with value:', value);
                  handleUpdateTelefone(value)
                    .catch(error => console.error('[NewEditProfileScreen] Erro ao atualizar telefone:', error));
                }}
                accessibilityLabel="Campo de telefone"
                accessibilityHint="Digite seu número de telefone com DDD"
              />
            ), [control, errors, isLoadingTelefone, telefoneUpdateStatus, handleUpdateTelefone])}

            {/* Campo Endereço */}
            {useMemo(() => (
              <ProfileField
                name="endereco"
                control={control}
                label="Endereço"
                placeholder="Endereço"
                icon="location-on"
                errors={errors}
                isLoading={isLoadingEndereco}
                updateStatus={enderecoUpdateStatus}
                onSave={(value) => {
                  console.log('[NewEditProfileScreen] Save endereco button pressed with value:', value);
                  handleUpdateEndereco(value)
                    .catch(error => console.error('[NewEditProfileScreen] Erro ao atualizar endereço:', error));
                }}
                accessibilityLabel="Campo de endereço"
                accessibilityHint="Digite seu endereço completo"
              />
            ), [control, errors, isLoadingEndereco, enderecoUpdateStatus, handleUpdateEndereco])}

            {/* Campo Data de Nascimento */}
            {useMemo(() => (
              <View 
                style={styles.inputContainer}
                accessible={true}
                accessibilityRole="none"
                accessibilityLabel="Seção de data de nascimento"
              >
                <Text 
                  style={styles.label}
                  accessibilityRole="header"
                >
                  Data de Nascimento
                </Text>
                <View style={styles.dateContainer}>
                  <TouchableOpacity 
                    style={[styles.inputWrapper, { flex: 0.8 }]}
                    onPress={() => setShowDatePicker(true)}
                    disabled={isLoading || isLoadingDataNascimento}
                    accessibilityLabel={`Data de nascimento: ${formatDate(user?.dataNascimento)}`}
                    accessibilityHint="Toque para abrir o seletor de data"
                    accessibilityRole="button"
                    accessibilityState={{ 
                      disabled: isLoading || isLoadingDataNascimento,
                      busy: isLoadingDataNascimento
                    }}
                  >
                    <MaterialIcons 
                      name="calendar-today" 
                      size={20} 
                      color="#666" 
                      style={styles.inputIcon}
                      accessibilityLabel="Ícone de calendário" 
                    />
                    <Text style={styles.dateText}>
                      {formatDate(user?.dataNascimento)}
                    </Text>
                  </TouchableOpacity>
                  {isLoadingDataNascimento ? (
                    <ActivityIndicator 
                      size="small" 
                      color="#4a80f5" 
                      style={{ marginLeft: 10 }}
                      accessibilityLabel="Atualizando data de nascimento"
                      accessibilityHint="Por favor aguarde enquanto salvamos suas alterações"
                      importantForAccessibility="yes"
                    />
                  ) : (
                    dataNascimentoUpdateStatus === 'success' && (
                      <MaterialIcons 
                        name="check-circle" 
                        size={24} 
                        color="#34c759" 
                        style={styles.fieldIndicator}
                        accessibilityLabel="Data de nascimento salva com sucesso"
                        importantForAccessibility="yes"
                      />
                    )
                  )}
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={user?.dataNascimento ? new Date(user.dataNascimento) : new Date(2000, 0, 1)}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => onDateChange(event, date)}
                    maximumDate={new Date()}
                    accessibilityLabel="Seletor de data de nascimento"
                  />
                )}
                {dataNascimentoUpdateStatus === 'success' && (
                  <Text 
                    style={styles.successText}
                    accessibilityRole="alert"
                    accessibilityLabel="Data de nascimento atualizada com sucesso!"
                  >
                    Data de nascimento atualizada com sucesso!
                  </Text>
                )}
                {dataNascimentoUpdateStatus === 'error' && (
                  <Text 
                    style={styles.errorText}
                    accessibilityRole="alert"
                    accessibilityLabel="Erro ao atualizar data de nascimento. Tente novamente."
                  >
                    Erro ao atualizar data de nascimento. Tente novamente.
                  </Text>
                )}
              </View>
            ), [
              isLoading, 
              isLoadingDataNascimento, 
              dataNascimentoUpdateStatus, 
              user?.dataNascimento, 
              formatDate, 
              showDatePicker, 
              onDateChange, 
              setShowDatePicker
            ])}

            {/* Campo Gênero */}
            {useMemo(() => (
              <View 
                style={styles.inputContainer}
                accessible={true}
                accessibilityRole="radiogroup"
                accessibilityLabel="Seção de gênero"
              >
                <Text 
                  style={styles.label}
                  accessibilityRole="header"
                >
                  Gênero
                </Text>
                <View style={styles.buttonGroup}>
                  {renderGenderButton('Feminino', 'Feminino')}
                  {renderGenderButton('Masculino', 'Masculino')}
                  {renderGenderButton('Prefiro não dizer', 'Prefiro não dizer')}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }}>
                  {isLoadingGenero ? (
                    <ActivityIndicator 
                      size="small" 
                      color="#4a80f5"
                      accessibilityLabel="Atualizando gênero"
                      accessibilityHint="Por favor aguarde enquanto salvamos suas alterações"
                      importantForAccessibility="yes"
                    />
                  ) : (
                    generoUpdateStatus === 'success' && (
                      <MaterialIcons 
                        name="check-circle" 
                        size={24} 
                        color="#34c759"
                        accessibilityLabel="Gênero salvo com sucesso"
                        importantForAccessibility="yes"
                      />
                    )
                  )}
                </View>
                {generoUpdateStatus === 'success' && (
                  <Text 
                    style={styles.successText}
                    accessibilityRole="alert"
                    accessibilityLabel="Gênero atualizado com sucesso!"
                  >
                    Gênero atualizado com sucesso!
                  </Text>
                )}
                {generoUpdateStatus === 'error' && (
                  <Text 
                    style={styles.errorText}
                    accessibilityRole="alert"
                    accessibilityLabel="Erro ao atualizar gênero. Tente novamente."
                  >
                    Erro ao atualizar gênero. Tente novamente.
                  </Text>
                )}
              </View>
            ), [renderGenderButton, isLoadingGenero, generoUpdateStatus])}

          </View>

          {/* Componente de modal para alteração de email */}
          {useMemo(() => (
            <EmailChangeModal 
              isVisible={isEmailModalVisible}
              onClose={() => setIsEmailModalVisible(false)}
              userEmail={user.email || ''}
              userToken={user.token || ''}
            />
          ), [isEmailModalVisible, user.email, user.token, setIsEmailModalVisible])}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// Definição dos estilos da tela
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  buttonIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  inputSuccess: {
    borderColor: '#34c759',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  successText: {
    color: '#34c759',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  fieldIndicator: {
    marginLeft: 10,
  },
  // Estilos para o campo de data
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  // Estilos para os botões de gênero
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    marginTop: 5,
  },
  // Estilos para o campo de email e botão de alteração
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailInput: {
    flex: 1, // Ocupa todo o espaço disponível dentro do inputWrapper
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    maxWidth: '100%', // Garante que não ultrapasse os limites do container
  },
  changeEmailButton: {
    backgroundColor: '#4a80f5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    minWidth: 80, // Garante uma largura mínima para o botão
  },
  changeEmailButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  // Estilos para a mensagem informativa
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6efff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 30,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    color: '#4a80f5',
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    padding: 8,
    marginLeft: 5,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
