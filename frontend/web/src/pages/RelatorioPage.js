import React, { useState, useEffect } from 'react';

/**
 * RelatorioPage – Página de Relatórios e Indicadores (Web)
 *
 * Esta página busca os indicadores analíticos do backend e os exibe.
 * São mostrados dados como:
 *   - Usuários por tipo
 *   - Contratações por status
 *   - Média de avaliações
 *   - Total de publicações aprovadas
 *
 * O token JWT é recuperado do localStorage para autenticar a requisição.
 */
export default function RelatorioPage() {
  // Recupera o token JWT do localStorage para autenticação
  const token = localStorage.getItem('token');

  // Estado para armazenar o relatório retornado do backend
  const [relatorio, setRelatorio] = useState(null);
  // Estado para gerenciar o loading enquanto os dados são buscados
  const [loading, setLoading] = useState(true);
  // Estado para armazenar possíveis mensagens de erro
  const [error, setError] = useState(null);

  /**
   * fetchRelatorio – Função assíncrona para buscar o relatório do backend.
   * Realiza uma requisição GET ao endpoint /api/relatorio utilizando o token para autenticação.
   */
  const fetchRelatorio = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/relatorio', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setRelatorio(data.relatorio);
      } else {
        setError(data.message || 'Erro ao buscar relatório.');
      }
    } catch (err) {
      console.error('Erro ao buscar relatório:', err);
      setError('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  // Executa a função de busca do relatório quando o componente é montado
  useEffect(() => {
    fetchRelatorio();
  }, []);

  // Exibe uma mensagem de loading enquanto os dados são carregados
  if (loading) {
    return <div style={{ padding: '20px' }}>Carregando relatório...</div>;
  }

  // Exibe uma mensagem de erro, se houver
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Relatório de Indicadores</h2>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  // Verifica se o relatório foi carregado corretamente
  if (!relatorio) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Relatório de Indicadores</h2>
        <p>Nenhum dado disponível.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Relatório de Indicadores</h2>
      
      {/* Seção: Usuários por Tipo */}
      <h3>Usuários por Tipo:</h3>
      {relatorio.usuariosPorTipo && relatorio.usuariosPorTipo.length > 0 ? (
        relatorio.usuariosPorTipo.map((item) => (
          <p key={item._id}>{item._id}: {item.count}</p>
        ))
      ) : (
        <p>Nenhum dado de usuários por tipo disponível.</p>
      )}

      {/* Seção: Contratações por Status */}
      <h3>Contratações por Status:</h3>
      {relatorio.contratacoesPorStatus && relatorio.contratacoesPorStatus.length > 0 ? (
        relatorio.contratacoesPorStatus.map((item) => (
          <p key={item._id}>{item._id}: {item.count}</p>
        ))
      ) : (
        <p>Nenhum dado de contratações por status disponível.</p>
      )}

      {/* Seção: Média de Avaliações */}
      <h3>Média de Avaliações: {typeof relatorio.avgRating === 'number' ? relatorio.avgRating.toFixed(2) : 'N/A'}</h3>

      {/* Seção: Total de Publicações Aprovadas */}
      <h3>Total de Publicações Aprovadas: {relatorio.totalPublicacoes || 0}</h3>

      {/* Data de Geração do Relatório */}
      <p style={{ color: '#666' }}>
        Relatório gerado em: {relatorio.timestamp ? new Date(relatorio.timestamp).toLocaleString() : 'N/A'}
      </p>
    </div>
  );
}
