import React, { useState, useEffect } from 'react';

/**
 * CommunityPage – Página de Comunidade.
 * Permite que usuários autenticados criem publicações (posts ou eventos) e visualizem as publicações aprovadas.
 * Também possibilita a interação com a comunidade.
 */
export default function CommunityPage() {
  // Estados para gerenciar o conteúdo da publicação, tipo e lista de publicações
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState('post'); // 'post' ou 'evento'
  const [publicacoes, setPublicacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Recupera o token JWT armazenado no localStorage para requisições autenticadas
  const token = localStorage.getItem('token');

  /**
   * fetchPublicacoes – Busca as publicações aprovadas do backend.
   */
  const fetchPublicacoes = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/publicacao');
      const data = await response.json();
      if (response.ok) {
        setPublicacoes(data.publicacoes);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro ao buscar publicações:', error);
      alert('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  // Executa a busca de publicações quando o componente é montado
  useEffect(() => {
    fetchPublicacoes();
  }, []);

  /**
   * handleCreatePublicacao – Função que envia os dados da nova publicação para o backend.
   */
  const handleCreatePublicacao = async (e) => {
    e.preventDefault();
    if (!conteudo) {
      alert('O conteúdo da publicação é obrigatório.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/publicacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Inclui o token JWT no header de autorização
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conteudo, tipo })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        // Limpa o campo de conteúdo e atualiza as publicações
        setConteudo('');
        fetchPublicacoes();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro ao publicar:', error);
      alert('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Comunidade</h2>
      
      {/* Formulário para criar uma nova publicação */}
      <form onSubmit={handleCreatePublicacao}>
        <label>
          Publicação:
          <textarea
            placeholder="Digite sua publicação..."
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            style={{ width: '100%', height: '100px', marginBottom: '10px' }}
          />
        </label>
        <div style={{ marginBottom: '10px' }}>
          {/* Botões para selecionar o tipo de publicação */}
          <button type="button" onClick={() => setTipo('post')} style={{ marginRight: '10px' }}>
            Post
          </button>
          <button type="button" onClick={() => setTipo('evento')}>
            Evento
          </button>
          <span style={{ marginLeft: '10px' }}>Tipo selecionado: <strong>{tipo}</strong></span>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar'}
        </button>
      </form>

      <h3>Publicações Aprovadas</h3>
      {loading && <p>Carregando publicações...</p>}
      {publicacoes.map((pub) => (
        <div
          key={pub._id}
          style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
        >
          <p><strong>Autor:</strong> {pub.autor?.nome || 'Desconhecido'}</p>
          <p><strong>Conteúdo:</strong> {pub.conteudo}</p>
          <p><strong>Tipo:</strong> {pub.tipo}</p>
          <p><strong>Data:</strong> {new Date(pub.dataPostagem).toLocaleString()}</p>
          <p><strong>Status:</strong> {pub.status}</p>
        </div>
      ))}
    </div>
  );
}
