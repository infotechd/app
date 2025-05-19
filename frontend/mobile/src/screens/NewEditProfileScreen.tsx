import React, { useState, useEffect, useCallback } from 'react';
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
  Button
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
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

/**
 * Nova tela de edição de perfil.
 * Implementa validação com Zod e react-hook-form para melhor gerenciamento de formulários.
 */
export default function NewEditProfileScreen({ navigation }: EditProfileScreenProps) {
  // Obtém o usuário atual e as funções para atualizar o contexto de autenticação
  const { user, updateUser } = useAuth();

  // Tipo para o status de atualização de um campo
  type FieldStatus = 'idle' | 'loading' | 'success' | 'error';

  // Interface para o estado de um campo
  interface FieldState {
    status: FieldStatus;
    message?: string;
  }

  // Estados para controle de UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, setSelectedImageUrl] = useState<string | null>(null);

  // Estado para controlar a visibilidade do modal de alteração de email
  const [isEmailModalVisible, setIsEmailModalVisible] = useState<boolean>(false);

  // Estados para o date picker
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Estados para controle de carregamento dos novos campos
  const [isLoadingDataNascimento, setIsLoadingDataNascimento] = useState<boolean>(false);
  const [isLoadingGenero, setIsLoadingGenero] = useState<boolean>(false);
  const [dataNascimentoUpdateStatus, setDataNascimentoUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [generoUpdateStatus, setGeneroUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Estados para controle de carregamento e 'feedback' de cada campo usando useReducer
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({
    nome: { status: 'idle' },
    telefone: { status: 'idle' },
    endereco: { status: 'idle' }
  });

  // Getters para compatibilidade com o código existente
  const isLoadingNome = fieldStates.nome.status === 'loading';
  const isLoadingTelefone = fieldStates.telefone.status === 'loading';
  const isLoadingEndereco = fieldStates.endereco.status === 'loading';
  const nomeUpdateStatus = fieldStates.nome.status === 'loading' ? 'idle' : fieldStates.nome.status;
  const telefoneUpdateStatus = fieldStates.telefone.status === 'loading' ? 'idle' : fieldStates.telefone.status;
  const enderecoUpdateStatus = fieldStates.endereco.status === 'loading' ? 'idle' : fieldStates.endereco.status;

  // Setters para compatibilidade com o código existente
  const setIsLoadingNome = useCallback((loading: boolean | ((prevLoading: boolean) => boolean)) => {
    setFieldStates(prev => {
      const newLoadingValue = typeof loading === 'function' 
        ? loading(prev.nome.status === 'loading') 
        : loading;

      return {
        ...prev,
        nome: { 
          ...prev.nome,
          status: newLoadingValue ? 'loading' : prev.nome.status === 'loading' ? 'idle' : prev.nome.status 
        }
      };
    });
  }, []);

  const setIsLoadingTelefone = useCallback((loading: boolean | ((prevLoading: boolean) => boolean)) => {
    setFieldStates(prev => {
      const newLoadingValue = typeof loading === 'function' 
        ? loading(prev.telefone.status === 'loading') 
        : loading;

      return {
        ...prev,
        telefone: { 
          ...prev.telefone,
          status: newLoadingValue ? 'loading' : prev.telefone.status === 'loading' ? 'idle' : prev.telefone.status 
        }
      };
    });
  }, []);

  const setIsLoadingEndereco = useCallback((loading: boolean | ((prevLoading: boolean) => boolean)) => {
    setFieldStates(prev => {
      const newLoadingValue = typeof loading === 'function' 
        ? loading(prev.endereco.status === 'loading') 
        : loading;

      return {
        ...prev,
        endereco: { 
          ...prev.endereco,
          status: newLoadingValue ? 'loading' : prev.endereco.status === 'loading' ? 'idle' : prev.endereco.status 
        }
      };
    });
  }, []);

  const setNomeUpdateStatus = useCallback((status: 'idle' | 'success' | 'error' | ((prevStatus: 'idle' | 'success' | 'error') => 'idle' | 'success' | 'error')) => {
    setFieldStates(prev => {
      const prevStatus = prev.nome.status === 'loading' ? 'idle' : prev.nome.status as 'idle' | 'success' | 'error';
      const newStatus = typeof status === 'function' ? status(prevStatus) : status;

      return {
        ...prev,
        nome: { 
          ...prev.nome,
          status: prev.nome.status === 'loading' ? prev.nome.status : newStatus 
        }
      };
    });
  }, []);

  const setTelefoneUpdateStatus = useCallback((status: 'idle' | 'success' | 'error' | ((prevStatus: 'idle' | 'success' | 'error') => 'idle' | 'success' | 'error')) => {
    setFieldStates(prev => {
      const prevStatus = prev.telefone.status === 'loading' ? 'idle' : prev.telefone.status as 'idle' | 'success' | 'error';
      const newStatus = typeof status === 'function' ? status(prevStatus) : status;

      return {
        ...prev,
        telefone: { 
          ...prev.telefone,
          status: prev.telefone.status === 'loading' ? prev.telefone.status : newStatus 
        }
      };
    });
  }, []);

  const setEnderecoUpdateStatus = useCallback((status: 'idle' | 'success' | 'error' | ((prevStatus: 'idle' | 'success' | 'error') => 'idle' | 'success' | 'error')) => {
    setFieldStates(prev => {
      const prevStatus = prev.endereco.status === 'loading' ? 'idle' : prev.endereco.status as 'idle' | 'success' | 'error';
      const newStatus = typeof status === 'function' ? status(prevStatus) : status;

      return {
        ...prev,
        endereco: { 
          ...prev.endereco,
          status: prev.endereco.status === 'loading' ? prev.endereco.status : newStatus 
        }
      };
    });
  }, []);

  // Configuração do formulário com react-hook-form e validação Zod
  const { control, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(profileUpdateDataSchema),
    defaultValues: {
      nome: user?.nome || '',
      telefone: user?.telefone || '',
      endereco: user?.endereco || '',
      foto: user?.foto || '',
      dataNascimento: user?.dataNascimento ? new Date(user.dataNascimento) : undefined,
      genero: user?.genero || 'Prefiro não dizer',
    },
    mode: 'onChange' // Validação em tempo real ao alterar os campos
  });

  // Efeito para atualizar os valores do formulário e limpar a imagem selecionada quando o usuário do contexto for alterado
  useEffect(() => {
    if (user) {
      reset({
        nome: user.nome || '',
        telefone: user.telefone || '',
        endereco: user.endereco || '',
        foto: user.foto || '',
        dataNascimento: user.dataNascimento ? new Date(user.dataNascimento) : undefined,
        genero: user.genero || 'Prefiro não dizer',
      });

      // Limpar a imagem selecionada quando o usuário mudar
      setSelectedImageUrl(null);
    }
  }, [user, reset]);


  // Tipo para as funções de atualização de campo
  type FieldUpdateConfig = {
    fieldName: 'nome' | 'telefone' | 'endereco' | 'dataNascimento' | 'genero';
    currentValue: string | Date | undefined;
    newValue: string;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setStatus: React.Dispatch<React.SetStateAction<'idle' | 'success' | 'error'>>;
    updateApiFunction: (token: string, userId: { idUsuario?: string; id?: string }, value: string) => Promise<UpdateProfileResponse>;
  };

  /**
   * Função genérica para atualizar um campo do perfil
   * Reduz a duplicação de código entre as funções de atualização
   */
  const handleUpdateField = useCallback(async ({
    fieldName,
    currentValue,
    newValue,
    setLoading,
    setStatus,
    updateApiFunction
  }: FieldUpdateConfig) => {
    // Verifica se o usuário está autenticado
    if (!user?.token) {
      navigation.replace('Login');
      return;
    }

    // Verifica se o valor é diferente do atual
    if (newValue === currentValue) {
      return; // Não faz nada se o valor não mudou
    }

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

      const response = await updateApiFunction(user.token, userId, newValue);

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

      setStatus('success');

      // Mostra feedback temporário de sucesso
      setTimeout(() => {
        setStatus('idle');
      }, 3000);

    } catch (error) {
      console.error(`[NewEditProfileScreen] Erro ao atualizar ${fieldName}:`, error);
      setStatus('error');

      // Mostra feedback temporário de erro
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } finally {
      setLoading(false);
    }
  }, [user, navigation, updateUser]);

  // Função para atualizar o campo nome
  const handleUpdateNome = useCallback((nome: string) => {
    return handleUpdateField({
      fieldName: 'nome',
      currentValue: user?.nome,
      newValue: nome,
      setLoading: setIsLoadingNome,
      setStatus: setNomeUpdateStatus,
      updateApiFunction: updateNome
    });
  }, [handleUpdateField, user?.nome]);

  // Função para atualizar o campo telefone
  const handleUpdateTelefone = useCallback((telefone: string) => {
    return handleUpdateField({
      fieldName: 'telefone',
      currentValue: user?.telefone,
      newValue: telefone,
      setLoading: setIsLoadingTelefone,
      setStatus: setTelefoneUpdateStatus,
      updateApiFunction: updateTelefone
    });
  }, [handleUpdateField, user?.telefone]);

  // Função para atualizar o campo endereço
  const handleUpdateEndereco = useCallback((endereco: string) => {
    return handleUpdateField({
      fieldName: 'endereco',
      currentValue: user?.endereco,
      newValue: endereco,
      setLoading: setIsLoadingEndereco,
      setStatus: setEnderecoUpdateStatus,
      updateApiFunction: updateEndereco
    });
  }, [handleUpdateField, user?.endereco]);

  // Função para formatar a data para exibição
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Não informado';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'Data inválida';

    return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
  };

  // Função para lidar com a mudança de data
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue('dataNascimento', selectedDate, { 
        shouldDirty: true, 
        shouldValidate: true,
        shouldTouch: true
      });
      handleUpdateDataNascimento(selectedDate);
    }
  };

  // Função para atualizar a data de nascimento
  const handleUpdateDataNascimento = useCallback((dataNascimento: Date) => {
    return handleUpdateField({
      fieldName: 'dataNascimento',
      currentValue: user?.dataNascimento,
      newValue: dataNascimento.toISOString(),
      setLoading: setIsLoadingDataNascimento,
      setStatus: setDataNascimentoUpdateStatus,
      updateApiFunction: updateNome // Reutiliza a função de atualização de nome (deve ser substituída por uma específica)
    });
  }, [handleUpdateField, user?.dataNascimento]);

  // Função para atualizar o gênero
  const handleUpdateGenero = useCallback((genero: string) => {
    return handleUpdateField({
      fieldName: 'genero',
      currentValue: user?.genero,
      newValue: genero,
      setLoading: setIsLoadingGenero,
      setStatus: setGeneroUpdateStatus,
      updateApiFunction: updateNome // Reutiliza a função de atualização de nome (deve ser substituída por uma específica)
    });
  }, [handleUpdateField, user?.genero]);

  // Função auxiliar para botões de gênero
  const renderGenderButton = (value: string, title: string) => (
    <Button
      title={title}
      onPress={() => {
        setValue('genero', value as 'Feminino' | 'Masculino' | 'Prefiro não dizer', { 
          shouldDirty: true, 
          shouldValidate: true,
          shouldTouch: true
        });
        handleUpdateGenero(value);
      }}
      color={user?.genero === value ? '#3498db' : '#bdc3c7'} // Destaca o botão selecionado
      disabled={isLoading}
    />
  );

  // Função para atualizar a foto do perfil (mantida para compatibilidade)
  const handleUpdatePhoto = useCallback(async (imageUrl: string) => {
    if (!user?.token) {
      navigation.replace('Login');
      return;
    }

    setIsLoading(true);

    try {
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

    } catch (error) {
      console.error('[NewEditProfileScreen] Erro ao atualizar foto:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil.');
    } finally {
      setIsLoading(false);
    }
  }, [user, navigation, updateUser]);

  // Exibe um indicador de carregamento caso os dados do usuário ainda não estejam disponíveis
  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Carregando perfil...</Text>
      </View>
    );
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

            {/* Campo Nome */}
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

            {/* Campo Email (não editável diretamente) */}
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

            {/* Campo Telefone */}
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

            {/* Campo Endereço */}
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

            {/* Campo Data de Nascimento */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <View style={styles.dateContainer}>
                <TouchableOpacity 
                  style={[styles.inputWrapper, { flex: 0.8 }]}
                  onPress={() => setShowDatePicker(true)}
                  disabled={isLoading || isLoadingDataNascimento}
                >
                  <MaterialIcons name="calendar-today" size={20} color="#666" style={styles.inputIcon} />
                  <Text style={styles.dateText}>
                    {formatDate(user?.dataNascimento)}
                  </Text>
                </TouchableOpacity>
                {isLoadingDataNascimento ? (
                  <ActivityIndicator size="small" color="#4a80f5" style={{ marginLeft: 10 }} />
                ) : (
                  dataNascimentoUpdateStatus === 'success' && (
                    <MaterialIcons name="check-circle" size={24} color="#34c759" style={styles.fieldIndicator} />
                  )
                )}
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={user?.dataNascimento ? new Date(user.dataNascimento) : new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Campo Gênero */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gênero</Text>
              <View style={styles.buttonGroup}>
                {renderGenderButton('Feminino', 'Feminino')}
                {renderGenderButton('Masculino', 'Masculino')}
                {renderGenderButton('Prefiro não dizer', 'Prefiro não dizer')}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 }}>
                {isLoadingGenero ? (
                  <ActivityIndicator size="small" color="#4a80f5" />
                ) : (
                  generoUpdateStatus === 'success' && (
                    <MaterialIcons name="check-circle" size={24} color="#34c759" />
                  )
                )}
              </View>
            </View>

          </View>

          {/* Componente de modal para alteração de email */}
          <EmailChangeModal 
            isVisible={isEmailModalVisible}
            onClose={() => setIsEmailModalVisible(false)}
            userEmail={user.email || ''}
            userToken={user.token || ''}
          />
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
