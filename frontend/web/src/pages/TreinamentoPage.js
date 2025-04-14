import React, { useState, useEffect } from 'react';

/**
 * TreinamentoPage – Página para exibir treinamentos publicados.
 *
 * Permite que qualquer usuário visualize a lista de treinamentos e acesse os detalhes de cada um.
 * Essa página busca os treinamentos do backend através do endpoint /api/treinamento.
 */
export default function TreinamentoPage() {
  // Estado para armazenar a lista de treinamentos
  const [treinamentos, setTreinamentos] = useState([]);
  // Estado para controlar o carregamento enquanto os dados são buscados
  const [loading, setLoading] = useState(true);
  // Estado para capturar e exibir mensagens de erro
  const [error, setError] = useState(null);

  /**
   * fetchTreinamentos – Função assíncrona para buscar os treinamentos do backend.
   * Atualiza os estados 'treinamentos', 'loading' e 'error' conforme a resposta.
   */
  const fetchTreinamentos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/treinamento');
      const data = await response.json();
      if (response.ok) {
        // Atualiza o estado com a lista de treinamentos retornada
        setTreinamentos(data.treinamentos);
      } else {
        // Define a mensagem de erro caso a requisição não seja bem-sucedida
        setError(data.message || 'Erro ao buscar treinamentos.');
      }
    } catch (err) {
      console.error('Erro ao buscar treinamentos:', err);
      setError('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  // useEffect para buscar os treinamentos assim que o componente for montado
  useEffect(() => {
    fetchTreinamentos();
  }, []);

  // Se estiver carregando, exibe uma mensagem de "Carregando..."
  if (loading) {
    return <div style={{ padding: '20px' }}>Carregando treinamentos...</div>;
  }

  // Se ocorrer um erro, exibe a mensagem de erro
  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Treinamentos Disponíveis</h2>
      {/* Verifica se há treinamentos para exibir */}
      {treinamentos.length > 0 ? (
        treinamentos.map((treinamento) => (
          <div
            key={treinamento._id}
            style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
          >
            <h3>{treinamento.titulo}</h3>
            <p>{treinamento.descricao}</p>
            <p>
              <strong>Formato:</strong> {treinamento.formato}
            </p>
            {treinamento.dataHora && (
              <p>
                <strong>Data/Hora:</strong> {new Date(treinamento.dataHora).toLocaleString()}
              </p>
            )}
            <p>
              <strong>Preço:</strong> R$ {treinamento.preco}
            </p>
            <p>
              <strong>Status:</strong> {treinamento.status}
            </p>
            {/* Aqui pode ser adicionado um link ou botão para ver detalhes ou inscrever-se */}
          </div>
        ))
      ) : (
        <p>Nenhum treinamento disponível.</p>
      )}
    </div>
  );
}
