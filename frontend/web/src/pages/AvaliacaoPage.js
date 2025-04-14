import React, { useState } from 'react';

/**
 * AvaliacaoPage – Página para registrar avaliação.
 * Permite que o usuário registre uma avaliação para outro, utilizando formulários controlados.
 * O token JWT é obtido (por exemplo, do localStorage) e enviado no header da requisição.
 */
export default function AvaliacaoPage() {
  // Recupera o token de autenticação do localStorage
  const token = localStorage.getItem('token');

  // Estados para armazenar os dados do formulário
  const [receptorId, setReceptorId] = useState('');
  const [nota, setNota] = useState('');
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * handleSubmit – Função que trata o envio do formulário de avaliação.
   * Valida os campos obrigatórios, envia a requisição ao backend e exibe o resultado.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação simples: receptorId e nota são obrigatórios
    if (!receptorId || !nota) {
      alert('ID do receptor e nota são obrigatórios.');
      return;
    }

    // Validação extra: nota deve estar entre 1 e 5
    const numericNota = Number(nota);
    if (numericNota < 1 || numericNota > 5) {
      alert('A nota deve ser um valor entre 1 e 5.');
      return;
    }

    setLoading(true);
    try {
      // Envia a requisição POST para o endpoint de avaliação
      const response = await fetch('http://localhost:5000/api/avaliacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receptorId,
          nota: numericNota,
          comentario
        })
      });
      const data = await response.json();
      // Exibe mensagem de sucesso ou erro conforme o status da resposta
      if (response.ok) {
        alert(data.message);
        // Limpa os campos do formulário após envio bem-sucedido
        setReceptorId('');
        setNota('');
        setComentario('');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Avaliar Usuário</h2>
      <form onSubmit={handleSubmit}>
        <label>
          ID do Receptor:
          <input
            type="text"
            placeholder="Digite o ID do receptor"
            value={receptorId}
            onChange={(e) => setReceptorId(e.target.value)}
          />
        </label>
        <br/>
        <label>
          Nota (1 a 5):
          <input
            type="number"
            placeholder="Digite a nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </label>
        <br/>
        <label>
          Comentário (opcional):
          <textarea
            placeholder="Digite seu comentário (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
        </label>
        <br/>
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Avaliação'}
        </button>
      </form>
    </div>
  );
}
