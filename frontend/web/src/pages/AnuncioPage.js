import React, { useState } from 'react';

export default function AnuncioPage() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagens, setImagens] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  // Suponha que o token esteja no localStorage
  const token = localStorage.getItem('token');

  // Função para enviar os dados do anúncio para o backend
  const handleCreateAd = async (e) => {
    e.preventDefault();
    // Validação simples
    if (!titulo || !descricao) {
      alert('Título e descrição são obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/anuncio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          titulo,
          descricao,
          // Converte a string de imagens em um array, removendo espaços e entradas vazias
          imagens: imagens.split(',').map(img => img.trim()).filter(img => img),
          link 
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        // Limpa os campos após o sucesso
        setTitulo('');
        setDescricao('');
        setImagens('');
        setLink('');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Falha na conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Criar Anúncio</h2>
      <form onSubmit={handleCreateAd}>
        <label>
          Título:
          <input 
            placeholder="Título" 
            value={titulo} 
            onChange={(e) => setTitulo(e.target.value)}
          />
        </label>
        <br/>
        <label>
          Descrição:
          <textarea 
            placeholder="Descrição" 
            value={descricao} 
            onChange={(e) => setDescricao(e.target.value)}
          />
        </label>
        <br/>
        <label>
          URLs de Imagens (separadas por vírgula):
          <input 
            placeholder="URLs de Imagens" 
            value={imagens} 
            onChange={(e) => setImagens(e.target.value)}
          />
        </label>
        <br/>
        <label>
          Link do anúncio:
          <input 
            placeholder="Link do anúncio" 
            value={link} 
            onChange={(e) => setLink(e.target.value)}
          />
        </label>
        <br/>
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Criar Anúncio'}
        </button>
      </form>
    </div>
  );
}
