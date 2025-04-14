import React, { useState, useEffect } from 'react';

/**
 * NotificacaoPage – Página para visualizar e gerenciar notificações (Web)
 * Permite que o usuário veja suas notificações, marque-as como lidas e as exclua.
 * O token JWT é recuperado do localStorage para autenticação nas requisições.
 */
export default function NotificacaoPage() {
  // Recupera o token JWT do localStorage
  const token = localStorage.getItem('token');

  // Estado para armazenar a lista de notificações e controle de carregamento
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * fetchNotificacoes – Função assíncrona para buscar notificações do backend.
   * Envia uma requisição GET para o endpoint de notificações.
   */
  const fetchNotificacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/notificacao', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setNotificacoes(data.notificacoes);
      } else {
        setError(data.message || 'Erro ao buscar notificações.');
      }
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  // Busca as notificações ao montar o componente
  useEffect(() => {
    fetchNotificacoes();
  }, []);

  /**
   * handleMarkAsRead – Função para marcar uma notificação como lida.
   * Envia uma requisição PUT para atualizar o status da notificação.
   * @param {string} id - ID da notificação a ser marcada como lida.
   */
  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notificacao/${id}/lida`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Após atualizar, refaz a busca para atualizar a lista de notificações
        fetchNotificacoes();
      } else {
        setError(data.message || 'Erro ao marcar notificação como lida.');
      }
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      setError('Falha na conexão.');
    }
  };

  /**
   * handleDelete – Função para excluir uma notificação.
   * Envia uma requisição DELETE para remover a notificação.
   * @param {string} id - ID da notificação a ser excluída.
   */
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notificacao/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Atualiza a lista de notificações após a exclusão
        fetchNotificacoes();
      } else {
        setError(data.message || 'Erro ao excluir notificação.');
      }
    } catch (err) {
      console.error('Erro ao excluir notificação:', err);
      setError('Falha na conexão.');
    }
  };

  // Exibe um indicador de carregamento enquanto as notificações são buscadas
  if (loading) {
    return <div style={{ padding: '20px' }}>Carregando notificações...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Notificações</h2>
      {/* Exibe mensagem de erro, se houver */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* Renderiza a lista de notificações */}
      {notificacoes.map((notificacao) => (
        <div
          key={notificacao._id}
          style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
        >
          <h3>{notificacao.titulo}</h3>
          <p>{notificacao.mensagem}</p>
          <p>
            <small>{new Date(notificacao.dataNotificacao).toLocaleString()}</small>
          </p>
          <p style={{ color: notificacao.lida ? 'green' : 'red' }}>
            {notificacao.lida ? 'Lida' : 'Não lida'}
          </p>
          <button onClick={() => handleMarkAsRead(notificacao._id)}>
            Marcar como lida
          </button>
          <button
            onClick={() => handleDelete(notificacao._id)}
            style={{ marginLeft: '10px', color: 'red' }}
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  );
}
