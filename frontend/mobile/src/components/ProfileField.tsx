import React, { memo, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, AccessibilityInfo } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Control, Controller, FieldErrors } from 'react-hook-form';

interface ProfileFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  placeholder: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  errors?: FieldErrors<any>;
  isLoading: boolean;
  updateStatus: 'idle' | 'success' | 'error';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  onSave: (value: string) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  editable?: boolean;
}

/**
 * Componente reutilizável para campos de perfil
 * Encapsula a lógica de exibição de campos de formulário com feedback de status
 */
const ProfileField: React.FC<ProfileFieldProps> = ({
  name,
  control,
  label,
  placeholder,
  icon,
  errors,
  isLoading,
  updateStatus,
  keyboardType = 'default',
  onSave,
  accessibilityLabel,
  accessibilityHint,
  editable = true
}) => {
  // Efeito para anunciar mudanças de status para leitores de tela
  useEffect(() => {
    if (updateStatus === 'success') {
      AccessibilityInfo.announceForAccessibility(`${label} atualizado com sucesso!`);
    } else if (updateStatus === 'error') {
      AccessibilityInfo.announceForAccessibility(`Erro ao atualizar ${label.toLowerCase()}. Tente novamente.`);
    } else if (isLoading) {
      AccessibilityInfo.announceForAccessibility(`Atualizando ${label.toLowerCase()}, por favor aguarde.`);
    }
  }, [updateStatus, isLoading, label]);

  // Função para lidar com o salvamento com feedback de acessibilidade
  const handleSave = useCallback((value: string) => {
    AccessibilityInfo.announceForAccessibility(`Salvando ${label.toLowerCase()}, por favor aguarde.`);
    onSave(value);
  }, [label, onSave]);

  return (
    <View 
      style={styles.inputContainer}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Seção de ${label.toLowerCase()}`}
    >
      <Text 
        style={styles.label}
        accessibilityRole="header"
      >
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <View 
              style={styles.inputWrapper}
              accessibilityRole="none"
            >
              <MaterialIcons 
                name={icon} 
                size={20} 
                color="#666" 
                style={styles.inputIcon}
                accessibilityLabel={`Ícone de ${label.toLowerCase()}`}
              />
              <TextInput
                placeholder={placeholder}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType={keyboardType}
                style={[
                  styles.input, 
                  errors?.[name] && styles.inputError,
                  updateStatus === 'success' && styles.inputSuccess,
                  updateStatus === 'error' && styles.inputError
                ]}
                editable={editable && !isLoading}
                accessibilityLabel={accessibilityLabel || `Campo de ${label.toLowerCase()}`}
                accessibilityHint={accessibilityHint || `Digite seu ${label.toLowerCase()}`}
                accessibilityState={{
                  disabled: !editable || isLoading
                }}
                importantForAccessibility="yes"
              />
              {editable && (
                <TouchableOpacity
                  onPress={() => handleSave(value ?? '')}
                  disabled={isLoading}
                  style={styles.saveButton}
                  accessibilityLabel={`Botão para salvar ${label.toLowerCase()}`}
                  accessibilityHint={`Toque para salvar as alterações no ${label.toLowerCase()}`}
                  accessibilityRole="button"
                  accessibilityState={{ 
                    disabled: isLoading,
                    busy: isLoading
                  }}
                >
                  <MaterialIcons name="save" size={20} color="#4a80f5" />
                </TouchableOpacity>
              )}
              {isLoading && (
                <ActivityIndicator 
                  size="small" 
                  color="#4a80f5" 
                  style={styles.fieldIndicator} 
                  testID={`${name}-loading-indicator`}
                  accessibilityLabel={`Carregando ${label.toLowerCase()}`}
                  accessibilityHint="Por favor aguarde enquanto salvamos suas alterações"
                  importantForAccessibility="yes"
                />
              )}
              {updateStatus === 'success' && (
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color="green" 
                  style={styles.fieldIndicator}
                  accessibilityLabel={`${label} salvo com sucesso`}
                  importantForAccessibility="yes"
                />
              )}
              {updateStatus === 'error' && (
                <MaterialIcons 
                  name="error" 
                  size={20} 
                  color="red" 
                  style={styles.fieldIndicator}
                  accessibilityLabel={`Erro ao salvar ${label.toLowerCase()}`}
                  importantForAccessibility="yes"
                />
              )}
            </View>
            {errors?.[name] && (
              <Text 
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLabel={`Erro: ${typeof errors[name]?.message === 'string' ? errors[name]?.message : 'Campo inválido'}`}
              >
                {typeof errors[name]?.message === 'string' ? errors[name]?.message : 'Campo inválido'}
              </Text>
            )}
            {updateStatus === 'success' && (
              <Text 
                style={styles.successText}
                accessibilityRole="alert"
                accessibilityLabel={`${label} atualizado com sucesso!`}
              >
                {label} atualizado com sucesso!
              </Text>
            )}
            {updateStatus === 'error' && (
              <Text 
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLabel={`Erro ao atualizar ${label.toLowerCase()}. Tente novamente.`}
              >
                Erro ao atualizar {label.toLowerCase()}. Tente novamente.
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
  saveButton: {
    padding: 8,
    marginLeft: 5,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(ProfileField);
