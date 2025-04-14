import React, { useState } from 'react';

/**
 * PagamentoPage – Página para Processamento de Pagamento (Web)
 * Permite que o usuário efetue o pagamento de um serviço.
 * O token JWT é recuperado do localStorage para autenticação.
 * O contratacaoId é um valor fixo para exemplificação, mas deve ser definido dinamicamente conforme a contratação ativa.
 */
export default function PagamentoPage() {
  // Recupera o token JWT do localStorage
  const token = localStorage.getItem('token');

  // Em uma aplicação real, o contratacaoId deve ser obtido dinamicamente
  const contratacaoId = "CONTRATACAO_EXEMPLO";

  // Estados para armazenar o valor e método de pagamento
  const [valor, setValor] = useState('');
  const [metodo, setMetodo] = useState('cartao'); // Valor padrão 'cartao'
  
  // Estados para gerenciar loading e mensagens de erro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * handleProcessarPagamento – Função para enviar os dados de pagamento para o backend.
   * Realiza validações básicas antes de enviar a requisição e trata os estados de loading e erro.
   */
  const handleProcessarPagamento = async (e) => {
    e.preventDefault();
    setError(null);

    // Validação: Verifica se o valor e o método foram preenchidos
    if (!valor || !metodo) {
      setError('Preencha os dados do pagamento.');
      return;
    }

    // Validação extra: Certifica que o valor é um número positivo
    const numericValor = Number(valor);
    if (isNaN(numericValor) || numericValor <= 0) {
      setError('Informe um valor válido para o pagamento.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/pagamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Envia o token JWT para autenticação
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contratacaoId,
          valor: numericValor,
          metodo
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        // Opcional: Limpar os campos após o sucesso
        setValor('');
        setMetodo('cartao');
      } else {
        setError(data.message || 'Falha ao processar o pagamento.');
      }
    } catch (error) {
      console.error('Erro na requisição de pagamento:', error);
      setError('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Processar Pagamento</h2>
      {/* Exibe mensagem de erro, se houver */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleProcessarPagamento}>
        <input
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={{ marginBottom: '10px', padding: '8px', width: '100%' }}
        /><br/>
        <input
          type="text"
          placeholder="Método (cartao, boleto, pix)"
          value={metodo}
          onChange={(e) => setMetodo(e.target.value)}
          style={{ marginBottom: '10px', padding: '8px', width: '100%' }}
        /><br/>
        <button type="submit" disabled={loading}>
          {loading ? 'Processando...' : 'Efetuar Pagamento'}
        </button>
      </form>
    </div>
  );
}
