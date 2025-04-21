import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

// 1. Imports
import { useAuth } from '../context/AuthContext';
import {
  iniciarNegociacao as apiIniciarNegociacao,
  responderNegociacao as apiResponderNegociacao,
  confirmarNegociacao as apiConfirmarNegociacao,
  fetchNegociacaoByContratacaoId as apiFetchNegociacao // API para buscar estado inicial
} from '../services/api';
import {
  Negociacao,
  PropostaAjuste,
  NegociacaoInitiateData,
  NegociacaoRespondData,
  NegociacaoStatus // Importar o tipo de status
} from '../types/negociacao';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// 2. Tipo das Props
type NegociacaoScreenProps = NativeStackScreenProps<RootStackParamList, 'Negociacao'>;

/**
 * Tela para Gerenciar a Negociação de Ajustes (Mobile)
 */
export default function NegociacaoScreen({ route, navigation }: NegociacaoScreenProps) {
  // 3. Extrair params e obter usuário/token/tipo
  const { contratacaoId, providerId } = route.params;
  const { user } = useAuth(); // Contém user.token e user.tipoUsuario

  // 4. Tipar Estados Locais
  // Estado para a negociação carregada/atual
  const [negociacao, setNegociacao] = useState<Negociacao | null>(null);

  // Estados para os formulários (separados para clareza)
  const [propostaPreco, setPropostaPreco] = useState<string>('');
  const [propostaPrazo, setPropostaPrazo] = useState<string>('');
  const [propostaObs, setPropostaObs] = useState<string>('');

  const [respostaPreco, setRespostaPreco] = useState<string>('');
  const [respostaPrazo, setRespostaPrazo] = useState<string>('');
  const [respostaObs, setRespostaObs] = useState<string>('');

  // Estados de Loading/Erro
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Para qualquer ação de submit
  const [error, setError] = useState<string | null>(null);

  // Função auxiliar para determinar o papel do usuário logado
  const isComprador = user?.tipoUsuario === 'comprador';
  const isPrestador = user?.tipoUsuario === 'prestador';

  // 5. Buscar estado inicial da negociação
  const loadNegociacao = useCallback(async () => {
    if (!user?.token || !contratacaoId) return;
    setIsFetching(true);
    setError(null);
    try {
      const response = await apiFetchNegociacao(user.token, contratacaoId);
      setNegociacao(response.negociacao); // Seta null se não existir
      // Preencher forms se negociação já existe? Opcional.
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar negociação';
      setError(msg);
      Alert.alert('Erro', msg);
    } finally {
      setIsFetching(false);
    }
  }, [user?.token, contratacaoId]);

  useEffect(() => {
    loadNegociacao();
  }, [loadNegociacao]);


  // 6. Refatorar Funções Handler com API tipada
  const handleIniciarNegociacao = async () => {
    if (!user?.token || !isComprador) return; // Só comprador inicia

    const precoNum = Number(propostaPreco);
    if (!propostaPreco || isNaN(precoNum) || !propostaPrazo.trim()) {
      Alert.alert('Erro', 'Informe o novo preço e o novo prazo.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const proposta: PropostaAjuste = {
      novoPreco: precoNum,
      novoPrazo: propostaPrazo.trim(),
      observacoes: propostaObs.trim() || undefined,
    };
    const initiateData: NegociacaoInitiateData = {
      contratacaoId,
      providerId,
      propostaInicial: proposta,
    };

    try {
      const response = await apiIniciarNegociacao(user.token, initiateData);
      setNegociacao(response.negociacao || null); // Atualiza estado com a negociação retornada
      Alert.alert('Sucesso', response.message);
      // Limpar form?
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao iniciar negociação';
      setError(msg); Alert.alert('Erro', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResponderNegociacao = async () => {
    if (!user?.token || !isPrestador || !negociacao?._id) return; // Só prestador responde

    const precoNum = Number(respostaPreco);
    if (!respostaPreco || isNaN(precoNum) || !respostaPrazo.trim()) {
      Alert.alert('Erro', 'Informe o novo preço e o novo prazo na resposta.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const resposta: PropostaAjuste = {
      novoPreco: precoNum,
      novoPrazo: respostaPrazo.trim(),
      observacoes: respostaObs.trim() || undefined,
    };
    const responseData: NegociacaoRespondData = { respostaProvider: resposta };

    try {
      const response = await apiResponderNegociacao(user.token, negociacao._id, responseData);
      setNegociacao(response.negociacao || null);
      Alert.alert('Sucesso', response.message);
      // Limpar form?
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao responder negociação';
      setError(msg); Alert.alert('Erro', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmarNegociacao = async () => {
    if (!user?.token || !isComprador || !negociacao?._id) return; // Só comprador confirma

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiConfirmarNegociacao(user.token, negociacao._id);
      setNegociacao(response.negociacao || null);
      Alert.alert('Sucesso', response.message);
      // Talvez navegar de volta ou para o contrato atualizado?
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao confirmar negociação';
      setError(msg); Alert.alert('Erro', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Renderização ---

  if (isFetching) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" /></View>;
  }

  // Se deu erro ao buscar o estado inicial (e não temos negociação)
  if (error && !negociacao) {
    return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Negociação de Ajustes</Text>
        <Text style={styles.info}>Contrato ID: {contratacaoId}</Text>

        {/* 7. Lógica de Exibição Condicional */}

        {/* Formulário para Comprador iniciar (se não houver negociação e user for comprador) */}
        {!negociacao && isComprador && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Iniciar Negociação (Sua Proposta):</Text>
            <TextInput placeholder="Novo Preço" value={propostaPreco} onChangeText={setPropostaPreco} keyboardType="numeric" style={styles.input} editable={!isSubmitting} />
            <TextInput placeholder="Novo Prazo (ex: 3 dias úteis)" value={propostaPrazo} onChangeText={setPropostaPrazo} style={styles.input} editable={!isSubmitting} />
            <TextInput placeholder="Observações (opcional)" value={propostaObs} onChangeText={setPropostaObs} style={[styles.input, styles.textArea]} multiline editable={!isSubmitting}/>
            <Button title={isSubmitting ? "Enviando..." : "Iniciar Negociação"} onPress={handleIniciarNegociacao} disabled={isSubmitting} />
          </View>
        )}

        {/* Formulário para Prestador responder (se negociação existe, status pendente e user for prestador) */}
        {negociacao && negociacao.status === 'pendente' && isPrestador && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Responder Negociação (Sua Contraproposta):</Text>
            {/* Exibe proposta inicial do comprador para referência */}
            <View style={styles.proposalBox}>
              <Text style={styles.proposalLabel}>Proposta Recebida:</Text>
              <Text>Preço: {negociacao.propostaInicial.novoPreco}</Text>
              <Text>Prazo: {negociacao.propostaInicial.novoPrazo}</Text>
              {negociacao.propostaInicial.observacoes && <Text>Obs: {negociacao.propostaInicial.observacoes}</Text>}
            </View>
            <TextInput placeholder="Novo Preço (Sua Contraproposta)" value={respostaPreco} onChangeText={setRespostaPreco} keyboardType="numeric" style={styles.input} editable={!isSubmitting} />
            <TextInput placeholder="Novo Prazo (Sua Contraproposta)" value={respostaPrazo} onChangeText={setRespostaPrazo} style={styles.input} editable={!isSubmitting} />
            <TextInput placeholder="Observações (opcional)" value={respostaObs} onChangeText={setRespostaObs} style={[styles.input, styles.textArea]} multiline editable={!isSubmitting}/>
            <Button title={isSubmitting ? "Enviando..." : "Enviar Resposta"} onPress={handleResponderNegociacao} disabled={isSubmitting} />
            {/* TODO: Adicionar botão para Rejeitar Negociação */}
          </View>
        )}

        {/* Botão para Comprador confirmar (se negociação existe, status contraproposta e user for comprador) */}
        {negociacao && negociacao.status === 'contraproposta' && isComprador && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirmar Ajustes Propostos pelo Prestador?</Text>
            <View style={styles.proposalBox}>
              <Text style={styles.proposalLabel}>Contraproposta Recebida:</Text>
              {/* Garante que respostaProvider existe antes de acessar */}
              <Text>Preço: {negociacao.respostaProvider?.novoPreco}</Text>
              <Text>Prazo: {negociacao.respostaProvider?.novoPrazo}</Text>
              {negociacao.respostaProvider?.observacoes && <Text>Obs: {negociacao.respostaProvider.observacoes}</Text>}
            </View>
            <Button title={isSubmitting ? "Confirmando..." : "Confirmar Ajustes"} onPress={handleConfirmarNegociacao} disabled={isSubmitting} />
            {/* TODO: Adicionar botão para Rejeitar Contraproposta */}
          </View>
        )}

        {/* Exibe detalhes da negociação existente */}
        {negociacao && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes da Negociação Atual:</Text>
            <Text>Status: {negociacao.status}</Text>
            <Text style={styles.detailItem}>Proposta Inicial (Comprador): Preço R$ {negociacao.propostaInicial.novoPreco.toFixed(2)}, Prazo: {negociacao.propostaInicial.novoPrazo}</Text>
            {negociacao.propostaInicial.observacoes && <Text style={styles.detailObs}>Obs: {negociacao.propostaInicial.observacoes}</Text>}
            {negociacao.respostaProvider && (
              <>
                <Text style={styles.detailItem}>Resposta (Prestador): Preço R$ {negociacao.respostaProvider.novoPreco.toFixed(2)}, Prazo: {negociacao.respostaProvider.novoPrazo}</Text>
                {negociacao.respostaProvider.observacoes && <Text style={styles.detailObs}>Obs: {negociacao.respostaProvider.observacoes}</Text>}
              </>
            )}
          </View>
        )}

        {/* Mensagem se não for o turno do usuário ou negociação concluída */}
        {negociacao && (
          (negociacao.status === 'pendente' && isComprador) ||
          (negociacao.status === 'contraproposta' && isPrestador) ||
          ['confirmada', 'rejeitada', 'cancelada'].includes(negociacao.status)
        ) && (
          <View style={styles.section}>
            <Text style={styles.info}>
              {negociacao.status === 'pendente' ? 'Aguardando resposta do Prestador.' :
                negociacao.status === 'contraproposta' ? 'Aguardando sua confirmação (Comprador).' :
                  `Negociação ${negociacao.status}.`}
            </Text>
          </View>
        )}

        {/* Mostra erro da API se houver */}
        {error && <Text style={[styles.errorText, {marginTop: 15}]}>{error}</Text>}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 8. Estilos
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  info: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 20 },
  section: { marginVertical: 15, padding: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 5, backgroundColor: '#f9f9f9' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10, fontSize: 15, backgroundColor: '#fff' },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  proposalBox: { backgroundColor: '#e9ecef', padding: 10, borderRadius: 5, marginBottom: 15 },
  proposalLabel: { fontWeight: 'bold', marginBottom: 5 },
  detailItem: { marginTop: 5 },
  detailObs: { fontStyle: 'italic', color: '#555', marginLeft: 10, marginTop: 2 },
  errorText: { color: 'red', textAlign: 'center' },
});