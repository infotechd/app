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

// 1. Importações
// Este arquivo importa os componentes React Native necessários para construir a interface,
// além de hooks do React para gerenciamento de estado e efeitos colaterais.
import { useAuth } from "@/context/AuthContext";
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
  NegociacaoRespondData
} from "@/types/negociacao";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props
// Esta seção define o tipo das propriedades que este componente recebe.
// Utiliza o NativeStackScreenProps do React Navigation para tipar corretamente
// os parâmetros de rota e navegação disponíveis para esta tela.
type NegociacaoScreenProps = NativeStackScreenProps<RootStackParamList, 'Negociacao'>;

/**
 * Tela para Gerenciar a Negociação de Ajustes (Mobile)
 * 
 * Este componente implementa uma interface para que compradores e prestadores
 * possam negociar ajustes em contratos, como alterações de preço e prazo.
 * A tela se adapta dinamicamente ao papel do usuário (comprador ou prestador)
 * e ao estado atual da negociação.
 */
export default function NegociacaoScreen({ route}: NegociacaoScreenProps) {
  // 3. Extrair parâmetros e obter usuário/token/tipo
  // Esta seção extrai os parâmetros da rota e obtém informações do usuário logado
  // através do contexto de autenticação
  const { contratacaoId, providerId } = route.params;
  const { user } = useAuth(); // Contém user.token, user.isComprador, user.isPrestador, etc.

  // 4. Definição dos Estados Locais
  // Esta seção define todos os estados necessários para o funcionamento do componente

  // Estado para armazenar a negociação carregada/atual
  const [negociacao, setNegociacao] = useState<Negociacao | null>(null);

  // Estados para os formulários de proposta do comprador (separados para clareza)
  // Estes estados armazenam os valores dos campos do formulário de proposta inicial
  const [propostaPreco, setPropostaPreco] = useState<string>('');
  const [propostaPrazo, setPropostaPrazo] = useState<string>('');
  const [propostaObs, setPropostaObs] = useState<string>('');

  // Estados para os formulários de resposta do prestador
  // Estes estados armazenam os valores dos campos do formulário de contraproposta
  const [respostaPreco, setRespostaPreco] = useState<string>('');
  const [respostaPrazo, setRespostaPrazo] = useState<string>('');
  const [respostaObs, setRespostaObs] = useState<string>('');

  // Estados de carregamento e erro
  // Controlam a exibição de indicadores visuais e mensagens de erro
  const [isFetching, setIsFetching] = useState<boolean>(true); // Indica se está carregando dados
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Indica se está enviando dados
  const [error, setError] = useState<string | null>(null); // Armazena mensagens de erro

  // Função auxiliar para determinar o papel do usuário logado
  // Estas constantes são usadas para controlar a exibição condicional de elementos na interface
  // com base no tipo de usuário (comprador ou prestador)
  const isComprador = user?.isComprador === true;
  const isPrestador = user?.isPrestador === true;

  // 5. Buscar estado inicial da negociação
  // Esta função é responsável por carregar os dados da negociação do servidor
  // quando o componente é montado ou quando as dependências mudam
  const loadNegociacao = useCallback(async () => {
    // Verifica se o usuário está autenticado e se o ID da contratação está disponível
    if (!user?.token || !contratacaoId) return;

    // Atualiza estados para indicar carregamento e limpar erros anteriores
    setIsFetching(true);
    setError(null);

    try {
      // Faz a requisição à API para buscar os dados da negociação
      const response = await apiFetchNegociacao(user.token, contratacaoId);
      // Atualiza o estado com os dados recebidos (ou null se não existir)
      setNegociacao(response.negociacao); 
      // Preencher formulários se negociação já existe? Opcional.
    } catch (err) {
      // Trata erros que possam ocorrer durante a requisição
      const msg = err instanceof Error ? err.message : 'Erro ao carregar negociação';
      setError(msg);
      Alert.alert('Erro', msg);
    } finally {
      // Finaliza o estado de carregamento independentemente do resultado
      setIsFetching(false);
    }
  }, [user?.token, contratacaoId]);

  // Este useEffect executa a função de carregamento de dados quando o componente é montado
  // ou quando a função loadNegociacao muda (devido a alterações em suas dependências)
  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadNegociacao();
      } catch (error) {
        console.error("Erro ao carregar negociação:", error);
      }
    };

    // Executa a função e captura qualquer erro não tratado
    fetchData().catch(error => {
      console.error("Erro na função fetchData:", error);
    });
  }, [loadNegociacao]);


  // 6. Funções de Manipulação de Eventos (Handlers)
  // Esta seção contém as funções que respondem às interações do usuário
  // como iniciar, responder e confirmar negociações
  // Função que permite ao comprador iniciar uma negociação
  // Esta função é chamada quando o comprador submete o formulário de proposta inicial
  const handleIniciarNegociacao = async () => {
    // Verifica se o usuário está autenticado e se é um comprador
    if (!user?.token || !isComprador) return; // Só comprador inicia

    // Converte o preço para número e valida os campos obrigatórios
    const precoNum = Number(propostaPreco);
    if (!propostaPreco || isNaN(precoNum) || !propostaPrazo.trim()) {
      Alert.alert('Erro', 'Informe o novo preço e o novo prazo.');
      return;
    }

    // Atualiza estados para indicar envio e limpar erros anteriores
    setIsSubmitting(true);
    setError(null);

    // Prepara o objeto de proposta com os dados do formulário
    const proposta: PropostaAjuste = {
      novoPreco: precoNum,
      novoPrazo: propostaPrazo.trim(),
      observacoes: propostaObs.trim() || undefined,
    };

    // Prepara o objeto completo para envio à API
    const initiateData: NegociacaoInitiateData = {
      contratacaoId,
      providerId,
      propostaInicial: proposta,
    };

    try {
      // Envia a proposta para a API
      const response = await apiIniciarNegociacao(user.token, initiateData);
      // Atualiza o estado com a negociação retornada
      setNegociacao(response.negociacao || null);
      // Exibe mensagem de sucesso
      Alert.alert('Sucesso', response.message);
      // Limpar formulário? (implementação futura)
    } catch (err) {
      // Trata erros que possam ocorrer durante o envio
      const msg = err instanceof Error ? err.message : 'Erro ao iniciar negociação';
      setError(msg); 
      Alert.alert('Erro', msg);
    } finally {
      // Finaliza o estado de envio independentemente do resultado
      setIsSubmitting(false);
    }
  };

  // Função que permite ao prestador responder a uma negociação
  // Esta função é chamada quando o prestador submete o formulário de contraproposta
  const handleResponderNegociacao = async () => {
    // Verifica se o usuário está autenticado, se é um prestador e se existe uma negociação ativa
    if (!user?.token || !isPrestador || !negociacao?._id) return; // Só prestador responde

    // Converte o preço para número e valida os campos obrigatórios
    const precoNum = Number(respostaPreco);
    if (!respostaPreco || isNaN(precoNum) || !respostaPrazo.trim()) {
      Alert.alert('Erro', 'Informe o novo preço e o novo prazo na resposta.');
      return;
    }

    // Atualiza estados para indicar envio e limpar erros anteriores
    setIsSubmitting(true);
    setError(null);

    // Prepara o objeto de resposta com os dados do formulário
    const resposta: PropostaAjuste = {
      novoPreco: precoNum,
      novoPrazo: respostaPrazo.trim(),
      observacoes: respostaObs.trim() || undefined,
    };

    // Prepara o objeto completo para envio à API
    const responseData: NegociacaoRespondData = { respostaProvider: resposta };

    try {
      // Envia a contraproposta para a API
      const response = await apiResponderNegociacao(user.token, negociacao._id, responseData);
      // Atualiza o estado com a negociação atualizada
      setNegociacao(response.negociacao || null);
      // Exibe mensagem de sucesso
      Alert.alert('Sucesso', response.message);
      // Limpar formulário? (implementação futura)
    } catch (err) {
      // Trata erros que possam ocorrer durante o envio
      const msg = err instanceof Error ? err.message : 'Erro ao responder negociação';
      setError(msg); 
      Alert.alert('Erro', msg);
    } finally {
      // Finaliza o estado de envio independentemente do resultado
      setIsSubmitting(false);
    }
  };

  // Função que permite ao comprador confirmar uma negociação
  // Esta função é chamada quando o comprador aceita a contraproposta do prestador
  const handleConfirmarNegociacao = async () => {
    // Verifica se o usuário está autenticado, se é um comprador e se existe uma negociação ativa
    if (!user?.token || !isComprador || !negociacao?._id) return; // Só comprador confirma

    // Atualiza estados para indicar envio e limpar erros anteriores
    setIsSubmitting(true);
    setError(null);

    try {
      // Envia a confirmação para a API
      const response = await apiConfirmarNegociacao(user.token, negociacao._id);
      // Atualiza o estado com a negociação finalizada
      setNegociacao(response.negociacao || null);
      // Exibe mensagem de sucesso
      Alert.alert('Sucesso', response.message);
      // Talvez navegar de volta ou para o contrato atualizado? (implementação futura)
    } catch (err) {
      // Trata erros que possam ocorrer durante o envio
      const msg = err instanceof Error ? err.message : 'Erro ao confirmar negociação';
      setError(msg); 
      Alert.alert('Erro', msg);
    } finally {
      // Finaliza o estado de envio independentemente do resultado
      setIsSubmitting(false);
    }
  };

  // --- Renderização ---
  // Esta seção contém a lógica de renderização condicional da interface
  // com base no estado atual da negociação e no papel do usuário

  // Exibe indicador de carregamento enquanto os dados estão sendo buscados
  if (isFetching) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" /></View>;
  }

  // Se ocorreu um erro ao buscar o estado inicial (e não temos negociação)
  // Exibe a mensagem de erro centralizada na tela
  if (error && !negociacao) {
    return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Negociação de Ajustes</Text>
        <Text style={styles.info}>Contrato ID: {contratacaoId}</Text>

        {/* 7. Lógica de Exibição Condicional */}
        {/* Esta seção implementa a renderização condicional dos diferentes formulários
            e visualizações com base no estado da negociação e no papel do usuário */}

        {/* Formulário para Comprador iniciar uma negociação 
            (exibido apenas se não houver negociação existente e o usuário for comprador) */}
        {!negociacao && isComprador && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Iniciar Negociação (Sua Proposta):</Text>
            <TextInput placeholder="Novo Preço" value={propostaPreco} onChangeText={setPropostaPreco} keyboardType="numeric" style={styles.input} editable={!isSubmitting} />
            <TextInput placeholder="Novo Prazo (ex: 3 dias úteis)" value={propostaPrazo} onChangeText={setPropostaPrazo} style={styles.input} editable={!isSubmitting} />
            <TextInput placeholder="Observações (opcional)" value={propostaObs} onChangeText={setPropostaObs} style={[styles.input, styles.textArea]} multiline editable={!isSubmitting}/>
            <Button title={isSubmitting ? "Enviando..." : "Iniciar Negociação"} onPress={handleIniciarNegociacao} disabled={isSubmitting} />
          </View>
        )}

        {/* Formulário para Prestador responder com uma contraproposta 
            (exibido apenas se existir uma negociação com status 'pendente' e o usuário for prestador) */}
        {negociacao && negociacao.status === 'pendente' && isPrestador && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Responder Negociação (Sua Contraproposta):</Text>
            {/* Exibe a proposta inicial enviada pelo comprador para referência do prestador */}
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
            {/* TODO: Adicionar botão para Rejeitar Negociação (funcionalidade futura) */}
          </View>
        )}

        {/* Botão para Comprador confirmar a contraproposta 
            (exibido apenas se existir uma negociação com status 'contraproposta' e o usuário for comprador) */}
        {negociacao && negociacao.status === 'contraproposta' && isComprador && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirmar Ajustes Propostos pelo Prestador?</Text>
            <View style={styles.proposalBox}>
              <Text style={styles.proposalLabel}>Contraproposta Recebida:</Text>
              {/* Verifica se respostaProvider existe antes de acessar suas propriedades (segurança) */}
              <Text>Preço: {negociacao.respostaProvider?.novoPreco}</Text>
              <Text>Prazo: {negociacao.respostaProvider?.novoPrazo}</Text>
              {negociacao.respostaProvider?.observacoes && <Text>Obs: {negociacao.respostaProvider.observacoes}</Text>}
            </View>
            <Button title={isSubmitting ? "Confirmando..." : "Confirmar Ajustes"} onPress={handleConfirmarNegociacao} disabled={isSubmitting} />
            {/* TODO: Adicionar botão para Rejeitar Contraproposta (funcionalidade futura) */}
          </View>
        )}

        {/* Exibe detalhes da negociação existente 
            (esta seção é sempre exibida quando existe uma negociação, independente do status) */}
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

        {/* Exibe mensagens de status da negociação 
            (quando não é o turno do usuário atual ou quando a negociação já foi concluída) */}
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

        {/* Exibe mensagem de erro da API, se houver algum erro durante as operações */}
        {error && <Text style={[styles.errorText, {marginTop: 15}]}>{error}</Text>}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 8. Definição de Estilos
// Esta seção define todos os estilos utilizados nos componentes da interface
const styles = StyleSheet.create({
  // Estilo do container principal com scroll
  container: { flexGrow: 1, padding: 20 },

  // Container centralizado para mensagens de carregamento e erro
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Estilo do título principal da tela
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },

  // Estilo para textos informativos
  info: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 20 },

  // Estilo das seções/cards que agrupam elementos relacionados
  section: { marginVertical: 15, padding: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 5, backgroundColor: '#f9f9f9' },

  // Estilo dos títulos de cada seção
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },

  // Estilo dos campos de entrada de texto
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10, fontSize: 15, backgroundColor: '#fff' },

  // Estilo adicional para áreas de texto com múltiplas linhas
  textArea: { minHeight: 60, textAlignVertical: 'top' },

  // Estilo da caixa que exibe propostas/contrapropostas
  proposalBox: { backgroundColor: '#e9ecef', padding: 10, borderRadius: 5, marginBottom: 15 },

  // Estilo do rótulo dentro da caixa de proposta
  proposalLabel: { fontWeight: 'bold', marginBottom: 5 },

  // Estilo dos itens de detalhe na visualização da negociação
  detailItem: { marginTop: 5 },

  // Estilo para observações nos detalhes (texto em itálico)
  detailObs: { fontStyle: 'italic', color: '#555', marginLeft: 10, marginTop: 2 },

  // Estilo para mensagens de erro
  errorText: { color: 'red', textAlign: 'center' },
});
