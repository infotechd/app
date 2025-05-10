import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

// 1. Imports
import { useAuth } from "@/context/AuthContext";
import { updateProfile as apiUpdateProfile } from '../services/api';
import { ProfileUpdateData } from "@/types/api"; // Tipo para dados da API
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props (sem parâmetros de rota agora)
type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

/**
 * Tela de edição de perfil.
 * Permite atualizar dados do usuário buscando dados do AuthContext
 * e enviando para o endpoint PUT /api/auth/profile.
 */
export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  // 3. Obter usuário e função 'login' (para atualizar) do contexto
  const { user, login: updateAuthContextUser } = useAuth();

  // 4. Estados locais para os campos do formulário, inicializados com dados do contexto
  //    Usar '' como fallback caso user seja null inicialmente
  const [nome, setNome] = useState<string>(user?.nome || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [telefone, setTelefone] = useState<string>(user?.telefone || '');
  const [endereco, setEndereco] = useState<string>(user?.endereco || '');
  const [foto, setFoto] = useState<string>(user?.foto || ''); // Adicionando foto
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Efeito para re-sincronizar estado local se o usuário do contexto mudar
  // Útil se a tela for montada antes do usuário ser totalmente carregado
  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setEmail(user.email || '');
      setTelefone(user.telefone || '');
      setEndereco(user.endereco || '');
      setFoto(user.foto || '');
    }
  }, [user]); // Dependência: user do contexto

  // 5. Refatorar handleUpdate
  const handleUpdate = async () => {
    // Garante que temos o usuário e o token antes de prosseguir
    if (!user || !user.token) {
      Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
      // Idealmente, redirecionar para Login ou tratar melhor este caso
      return;
    }

    setIsLoading(true);

    // Monta o objeto apenas com os campos que o usuário pode editar
    const profileData: ProfileUpdateData = {
      nome: nome,
      email: email, // Confirmar se a API permite mudar email
      telefone: telefone,
      endereco: endereco,
      foto: foto, // Incluindo foto
    };

    try {
      // Chama a função da API tipada, passando o token do contexto
      const response = await apiUpdateProfile(user.token, profileData);

      // Se a API retornar o usuário atualizado na resposta, use-o para atualizar o contexto
      if (response.user) {
        // Combina o usuário retornado com o token existente (pois a API pode não retornar o token)
        const updatedUserWithToken = { ...response.user, token: user.token };
        await updateAuthContextUser(updatedUserWithToken);
      } else {
        // Se a API não retornar o usuário, podemos ter que buscar novamente ou
        // criar manualmente um objeto User atualizado para o contexto.
        // Por simplicidade, vamos assumir que os dados locais + token antigo são suficientes por agora.
        // Idealmente, a API retornaria o usuário completo atualizado.
        const manuallyUpdatedUser = { ...user, ...profileData }; // Atualiza campos locais
        await updateAuthContextUser(manuallyUpdatedUser);
        console.warn("API updateProfile não retornou 'user'. Contexto atualizado manualmente.");
      }

      Alert.alert('Sucesso', response.message);
      navigation.goBack(); // Volta para a tela anterior

    } catch (error) {
      Alert.alert(
        'Erro ao Atualizar',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Se o usuário ainda não carregou (improvável se a navegação estiver correta)
  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Carregando perfil...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Editar Perfil</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput
          placeholder="Nome"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
          editable={!isLoading}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize='none'
          style={styles.input}
          editable={!isLoading} // Considerar se email pode ser editado
        />

        <Text style={styles.label}>Telefone</Text>
        <TextInput
          placeholder="Telefone"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          style={styles.input}
          editable={!isLoading}
        />

        <Text style={styles.label}>Endereço</Text>
        <TextInput
          placeholder="Endereço"
          value={endereco}
          onChangeText={setEndereco}
          style={styles.input}
          editable={!isLoading}
        />

        <Text style={styles.label}>URL da Foto</Text>
        <TextInput
          placeholder="URL da Foto de Perfil"
          value={foto}
          onChangeText={setFoto}
          style={styles.input}
          editable={!isLoading}
        />

        <Button
          title={isLoading ? "Atualizando..." : "Atualizar Perfil"}
          onPress={handleUpdate}
          disabled={isLoading}
        />
      </View>
    </ScrollView>
  );
}

// Estilos
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center', // Adicionado para centralizar um pouco
  },
  title: {
    fontSize: 22, // Aumentado
    fontWeight: 'bold', // Negrito
    marginBottom: 25, // Mais espaço
    textAlign: 'center',
  },
  label: {
    fontSize: 14, // Menor
    marginBottom: 5,
    marginLeft: 5, // Pequeno recuo
    color: '#333', // Cor mais escura
    fontWeight: '500', // Peso médio
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12, // Mais padding
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff', // Fundo branco
  },
});