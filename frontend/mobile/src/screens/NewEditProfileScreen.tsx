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
  TouchableWithoutFeedback
} from 'react-native';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialIcons } from '@expo/vector-icons';

// Importações necessárias para o funcionamento da tela
import { useAuth } from "@/context/AuthContext";
import { updateNome, updateTelefone, updateEndereco } from "@/services/updateFieldApi";
import { ProfileUpdateData } from "@/types/api";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";
import { profileUpdateDataSchema } from '@/schemas/user.schema';
import EmailChangeModal from '@/components/EmailChangeModal';
import ProfileImagePicker from '@/components/ProfileImagePicker';

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

  // Estados para controle de UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Estados para controle de carregamento e feedback de cada campo
  const [isLoadingNome, setIsLoadingNome] = useState<boolean>(false);
  const [isLoadingTelefone, setIsLoadingTelefone] = useState<boolean>(false);
  const [isLoadingEndereco, setIsLoadingEndereco] = useState<boolean>(false);

  // Estados para feedback de sucesso/erro de cada campo
  const [nomeUpdateStatus, setNomeUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [telefoneUpdateStatus, setTelefoneUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [enderecoUpdateStatus, setEnderecoUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Estado para controlar a visibilidade do modal de alteração de email
  const [isEmailModalVisible, setIsEmailModalVisible] = useState<boolean>(false);

  // Configuração do formulário com react-hook-form e validação Zod
  const { control, handleSubmit, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(profileUpdateDataSchema),
    defaultValues: {
      nome: user?.nome || '',
      telefone: user?.telefone || '',
      endereco: user?.endereco || '',
      foto: user?.foto || '',
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
      });

      // Limpar a imagem selecionada quando o usuário mudar
      setSelectedImageUrl(null);
    }
  }, [user, reset]);


  // Função para atualizar o campo nome
  const handleUpdateNome = useCallback(async (nome: string) => {
    // Verifica se o usuário está autenticado
    if (!user?.token) {
      navigation.replace('Login');
      return;
    }

    // Verifica se o valor é diferente do atual
    if (nome === user.nome) {
      return; // Não faz nada se o valor não mudou
    }

    setIsLoadingNome(true);
    setNomeUpdateStatus('idle');

    try {
      console.log('[NewEditProfileScreen] Atualizando nome para:', nome);

      // Ensure at least one ID field is present to satisfy validation
      const userId: { idUsuario?: string; id?: string } = {};

      // Only add fields that have actual values
      if (user.idUsuario) {
        userId.idUsuario = user.idUsuario;
      }

      if (user.id) {
        userId.id = user.id;
      }

      // If neither ID field is present, create a default one
      if (!userId.idUsuario && !userId.id) {
        // Use a fallback ID if available, or generate a temporary one
        userId.id = user.email || 'temp-id-' + Date.now();
        console.log('[NewEditProfileScreen] Created fallback ID for nome:', userId.id);
      }

      const response = await updateNome(user.token, userId, nome);

      // Atualiza o contexto de autenticação com os dados retornados
      if (response.user) {
        const userData = {
          ...user,
          nome: response.user.nome || nome
        };
        await updateUser(userData);
      } else {
        // Se a API não retornar os dados do usuário, atualiza apenas o nome
        await updateUser({
          ...user,
          nome
        });
      }

      setNomeUpdateStatus('success');

      // Mostra feedback temporário de sucesso
      setTimeout(() => {
        setNomeUpdateStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('[NewEditProfileScreen] Erro ao atualizar nome:', error);
      setNomeUpdateStatus('error');

      // Mostra feedback temporário de erro
      setTimeout(() => {
        setNomeUpdateStatus('idle');
      }, 3000);
    } finally {
      setIsLoadingNome(false);
    }
  }, [user, navigation, updateUser]);

  // Função para atualizar o campo telefone
  const handleUpdateTelefone = useCallback(async (telefone: string) => {
    // Verifica se o usuário está autenticado
    if (!user?.token) {
      navigation.replace('Login');
      return;
    }

    // Verifica se o valor é diferente do atual
    if (telefone === user.telefone) {
      return; // Não faz nada se o valor não mudou
    }

    setIsLoadingTelefone(true);
    setTelefoneUpdateStatus('idle');

    try {
      console.log('[NewEditProfileScreen] Atualizando telefone para:', telefone);

      // Ensure at least one ID field is present to satisfy validation
      const userId: { idUsuario?: string; id?: string } = {};

      // Only add fields that have actual values
      if (user.idUsuario) {
        userId.idUsuario = user.idUsuario;
      }

      if (user.id) {
        userId.id = user.id;
      }

      // If neither ID field is present, create a default one
      if (!userId.idUsuario && !userId.id) {
        // Use a fallback ID if available, or generate a temporary one
        userId.id = user.email || 'temp-id-' + Date.now();
        console.log('[NewEditProfileScreen] Created fallback ID for telefone:', userId.id);
      }

      const response = await updateTelefone(user.token, userId, telefone);

      // Atualiza o contexto de autenticação com os dados retornados
      if (response.user) {
        const userData = {
          ...user,
          telefone: response.user.telefone || telefone
        };
        await updateUser(userData);
      } else {
        // Se a API não retornar os dados do usuário, atualiza apenas o telefone
        await updateUser({
          ...user,
          telefone
        });
      }

      setTelefoneUpdateStatus('success');

      // Mostra feedback temporário de sucesso
      setTimeout(() => {
        setTelefoneUpdateStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('[NewEditProfileScreen] Erro ao atualizar telefone:', error);
      setTelefoneUpdateStatus('error');

      // Mostra feedback temporário de erro
      setTimeout(() => {
        setTelefoneUpdateStatus('idle');
      }, 3000);
    } finally {
      setIsLoadingTelefone(false);
    }
  }, [user, navigation, updateUser]);

  // Função para atualizar o campo endereço
  const handleUpdateEndereco = useCallback(async (endereco: string) => {
    // Verifica se o usuário está autenticado
    if (!user?.token) {
      navigation.replace('Login');
      return;
    }

    // Verifica se o valor é diferente do atual
    if (endereco === user.endereco) {
      return; // Não faz nada se o valor não mudou
    }

    setIsLoadingEndereco(true);
    setEnderecoUpdateStatus('idle');

    try {
      console.log('[NewEditProfileScreen] Atualizando endereço para:', endereco);

      // Ensure at least one ID field is present to satisfy validation
      const userId: { idUsuario?: string; id?: string } = {};

      // Only add fields that have actual values
      if (user.idUsuario) {
        userId.idUsuario = user.idUsuario;
      }

      if (user.id) {
        userId.id = user.id;
      }

      // If neither ID field is present, create a default one
      if (!userId.idUsuario && !userId.id) {
        // Use a fallback ID if available, or generate a temporary one
        userId.id = user.email || 'temp-id-' + Date.now();
        console.log('[NewEditProfileScreen] Created fallback ID for endereco:', userId.id);
      }

      const response = await updateEndereco(user.token, userId, endereco);

      // Atualiza o contexto de autenticação com os dados retornados
      if (response.user) {
        const userData = {
          ...user,
          endereco: response.user.endereco || endereco
        };
        await updateUser(userData);
      } else {
        // Se a API não retornar os dados do usuário, atualiza apenas o endereço
        await updateUser({
          ...user,
          endereco
        });
      }

      setEnderecoUpdateStatus('success');

      // Mostra feedback temporário de sucesso
      setTimeout(() => {
        setEnderecoUpdateStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('[NewEditProfileScreen] Erro ao atualizar endereço:', error);
      setEnderecoUpdateStatus('error');

      // Mostra feedback temporário de erro
      setTimeout(() => {
        setEnderecoUpdateStatus('idle');
      }, 3000);
    } finally {
      setIsLoadingEndereco(false);
    }
  }, [user, navigation, updateUser]);

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

      // Atualiza o contexto do usuário diretamente
      await updateUser({
        ...user,
        foto: imageUrl
      });

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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                handleUpdatePhoto(imageUrl);
              }}
              disabled={isLoading}
            />

            {/* Campo Nome */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome</Text>
              <Controller
                control={control}
                name="nome"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Nome"
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => {
                          onBlur();
                          // Don't update on blur, let the save button handle it
                        }}
                        style={[
                          styles.input, 
                          errors.nome && styles.inputError,
                          nomeUpdateStatus === 'success' && styles.inputSuccess,
                          nomeUpdateStatus === 'error' && styles.inputError
                        ]}
                        editable={!isLoadingNome}
                        accessibilityLabel="Campo de nome"
                        accessibilityHint="Digite seu nome completo"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          console.log('[NewEditProfileScreen] Save nome button pressed with value:', value);
                          handleUpdateNome(value ?? '');
                        }}
                        disabled={isLoadingNome}
                        style={styles.saveButton}
                        accessibilityLabel="Botão para salvar nome"
                        accessibilityHint="Toque para salvar as alterações no nome"
                      >
                        <MaterialIcons name="save" size={20} color="#4a80f5" />
                      </TouchableOpacity>
                      {isLoadingNome && (
                        <ActivityIndicator size="small" color="#4a80f5" style={styles.fieldIndicator} />
                      )}
                      {nomeUpdateStatus === 'success' && (
                        <MaterialIcons name="check-circle" size={20} color="green" style={styles.fieldIndicator} />
                      )}
                      {nomeUpdateStatus === 'error' && (
                        <MaterialIcons name="error" size={20} color="red" style={styles.fieldIndicator} />
                      )}
                    </View>
                    {errors.nome && (
                      <Text style={styles.errorText}>{errors.nome.message}</Text>
                    )}
                    {nomeUpdateStatus === 'success' && (
                      <Text style={styles.successText}>Nome atualizado com sucesso!</Text>
                    )}
                    {nomeUpdateStatus === 'error' && (
                      <Text style={styles.errorText}>Erro ao atualizar nome. Tente novamente.</Text>
                    )}
                  </View>
                )}
              />
            </View>

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
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone</Text>
              <Controller
                control={control}
                name="telefone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="phone" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Telefone"
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => {
                          onBlur();
                          // Don't update on blur, let the save button handle it
                        }}
                        keyboardType="phone-pad"
                        style={[
                          styles.input, 
                          errors.telefone && styles.inputError,
                          telefoneUpdateStatus === 'success' && styles.inputSuccess,
                          telefoneUpdateStatus === 'error' && styles.inputError
                        ]}
                        editable={!isLoadingTelefone}
                        accessibilityLabel="Campo de telefone"
                        accessibilityHint="Digite seu número de telefone com DDD"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          console.log('[NewEditProfileScreen] Save telefone button pressed with value:', value);
                          handleUpdateTelefone(value ?? '');
                        }}
                        disabled={isLoadingTelefone}
                        style={styles.saveButton}
                        accessibilityLabel="Botão para salvar telefone"
                        accessibilityHint="Toque para salvar as alterações no telefone"
                      >
                        <MaterialIcons name="save" size={20} color="#4a80f5" />
                      </TouchableOpacity>
                      {isLoadingTelefone && (
                        <ActivityIndicator size="small" color="#4a80f5" style={styles.fieldIndicator} />
                      )}
                      {telefoneUpdateStatus === 'success' && (
                        <MaterialIcons name="check-circle" size={20} color="green" style={styles.fieldIndicator} />
                      )}
                      {telefoneUpdateStatus === 'error' && (
                        <MaterialIcons name="error" size={20} color="red" style={styles.fieldIndicator} />
                      )}
                    </View>
                    {errors.telefone && (
                      <Text style={styles.errorText}>{errors.telefone.message}</Text>
                    )}
                    {telefoneUpdateStatus === 'success' && (
                      <Text style={styles.successText}>Telefone atualizado com sucesso!</Text>
                    )}
                    {telefoneUpdateStatus === 'error' && (
                      <Text style={styles.errorText}>Erro ao atualizar telefone. Tente novamente.</Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Campo Endereço */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Endereço</Text>
              <Controller
                control={control}
                name="endereco"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="location-on" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Endereço"
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => {
                          onBlur();
                          // Don't update on blur, let the save button handle it
                        }}
                        style={[
                          styles.input, 
                          errors.endereco && styles.inputError,
                          enderecoUpdateStatus === 'success' && styles.inputSuccess,
                          enderecoUpdateStatus === 'error' && styles.inputError
                        ]}
                        editable={!isLoadingEndereco}
                        accessibilityLabel="Campo de endereço"
                        accessibilityHint="Digite seu endereço completo"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          console.log('[NewEditProfileScreen] Save endereco button pressed with value:', value);
                          handleUpdateEndereco(value ?? '');
                        }}
                        disabled={isLoadingEndereco}
                        style={styles.saveButton}
                        accessibilityLabel="Botão para salvar endereço"
                        accessibilityHint="Toque para salvar as alterações no endereço"
                      >
                        <MaterialIcons name="save" size={20} color="#4a80f5" />
                      </TouchableOpacity>
                      {isLoadingEndereco && (
                        <ActivityIndicator size="small" color="#4a80f5" style={styles.fieldIndicator} />
                      )}
                      {enderecoUpdateStatus === 'success' && (
                        <MaterialIcons name="check-circle" size={20} color="green" style={styles.fieldIndicator} />
                      )}
                      {enderecoUpdateStatus === 'error' && (
                        <MaterialIcons name="error" size={20} color="red" style={styles.fieldIndicator} />
                      )}
                    </View>
                    {errors.endereco && (
                      <Text style={styles.errorText}>{errors.endereco.message}</Text>
                    )}
                    {enderecoUpdateStatus === 'success' && (
                      <Text style={styles.successText}>Endereço atualizado com sucesso!</Text>
                    )}
                    {enderecoUpdateStatus === 'error' && (
                      <Text style={styles.errorText}>Erro ao atualizar endereço. Tente novamente.</Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Nota informativa sobre atualização automática */}
            <View style={styles.infoContainer}>
              <MaterialIcons name="info" size={20} color="#4a80f5" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Os campos são atualizados automaticamente quando você termina de editá-los.
              </Text>
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
  // Estilos para o campo de email e botão de alteração
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailInput: {
    flex: 1, // Take up all available space within the inputWrapper
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f0f0f0',
    maxWidth: '100%', // Ensure it doesn't overflow its container
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
    minWidth: 80, // Ensure minimum width for the button
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
