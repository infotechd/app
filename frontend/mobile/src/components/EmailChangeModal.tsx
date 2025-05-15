import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestEmailChange, ApiError, EmailChangeErrorCode } from "@/services/api";

// Define o schema para o formulário de alteração de email
const emailChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: 'A senha atual é obrigatória' }),
  newEmail: z.string().email({ message: 'Email inválido' })
});

// Tipo para os dados do formulário
type EmailChangeFormData = z.infer<typeof emailChangeSchema>;

// Props para o componente EmailChangeModal
interface EmailChangeModalProps {
  isVisible: boolean;
  onClose: () => void;
  userEmail: string;
  userToken: string;
}

export default function EmailChangeModal({ 
  isVisible, 
  onClose, 
  userEmail, 
  userToken 
}: EmailChangeModalProps) {
  // Estado para rastrear o estado de carregamento durante a alteração de email
  const [isChangingEmail, setIsChangingEmail] = useState<boolean>(false);

  // Configuração do react-hook-form com validação zod
  const { control, handleSubmit, reset, formState: { errors } } = useForm<EmailChangeFormData>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      currentPassword: '',
      newEmail: ''
    }
  });

  // Função para lidar com a alteração de email
  const handleEmailChange = async (data: EmailChangeFormData) => {
    // Se o novo email for igual ao atual, mostra um aviso e fecha o modal
    if (data.newEmail === userEmail) {
      Alert.alert('Aviso', 'O novo email é igual ao atual');
      onClose();
      return;
    }

    setIsChangingEmail(true);

    try {
      // Chama a API para solicitar a alteração de email
      const response = await requestEmailChange(userToken, {
        currentPassword: data.currentPassword,
        newEmail: data.newEmail
      });

      // Reseta o formulário e fecha o modal
      reset();
      onClose();

      // Mostra a mensagem retornada pela API
      // Isso agora mostrará a mensagem sobre a funcionalidade não estar disponível
      Alert.alert(
        'Informação',
        response.message || 'Solicitação processada.'
      );
    } catch (error) {
      console.error('Erro ao solicitar alteração de email:', error);

      let errorMessage = 'Ocorreu um erro ao solicitar a alteração de email.';

      if (error instanceof ApiError) {
        // Tratamento baseado em códigos de erro específicos
        switch (error.errorCode) {
          case EmailChangeErrorCode.INCORRECT_PASSWORD:
            errorMessage = 'Senha incorreta. Por favor, verifique e tente novamente.';
            break;
          case EmailChangeErrorCode.EMAIL_IN_USE:
            errorMessage = 'Este email já está em uso por outra conta.';
            break;
          case EmailChangeErrorCode.INVALID_EMAIL_FORMAT:
            errorMessage = 'O formato do email é inválido.';
            break;
          case EmailChangeErrorCode.MISSING_FIELDS:
            errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
            break;
          case EmailChangeErrorCode.INVALID_TOKEN:
            errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
            break;
          case EmailChangeErrorCode.FEATURE_UNAVAILABLE:
            errorMessage = 'Esta funcionalidade não está disponível no momento.';
            break;
          default:
            // Usa a mensagem original do erro se disponível
            errorMessage = error.message || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Erro', errorMessage);
    } finally {
      setIsChangingEmail(false);
    }
  };

  // Função para lidar com o fechamento do modal e resetar o formulário
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Alterar Email</Text>

          <Text style={styles.modalText}>
            Por questões de segurança, é necessário confirmar sua senha atual e verificar o novo email.
          </Text>

          <Text style={styles.modalLabel}>Senha Atual</Text>
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <TextInput
                  placeholder="Digite sua senha atual"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={true}
                  style={[styles.modalInput, errors.currentPassword && styles.inputError]}
                  editable={!isChangingEmail}
                />
                {errors.currentPassword && (
                  <Text style={styles.errorText}>{errors.currentPassword.message}</Text>
                )}
              </View>
            )}
          />

          <Text style={styles.modalLabel}>Novo Email</Text>
          <Controller
            control={control}
            name="newEmail"
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <TextInput
                  placeholder="Digite o novo email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.modalInput, errors.newEmail && styles.inputError]}
                  editable={!isChangingEmail}
                />
                {errors.newEmail && (
                  <Text style={styles.errorText}>{errors.newEmail.message}</Text>
                )}
              </View>
            )}
          />

          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={handleClose}
              disabled={isChangingEmail}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirmButton]}
              onPress={handleSubmit(handleEmailChange)}
              disabled={isChangingEmail}
            >
              {isChangingEmail ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Estilos para o componente
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  modalConfirmButton: {
    backgroundColor: '#4a80f5',
    marginLeft: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
