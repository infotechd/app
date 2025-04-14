import React, { useState } from 'react';

/**
 * NegociacaoPage – Página de Negociação para Web.
 * Permite que o Buyer inicie uma negociação e que o Provider responda com uma contra-proposta.
 * O token JWT é recuperado (por exemplo, do localStorage) para autenticação das requisições.
 * 
 * Observação: Em uma aplicação real, os IDs de contratação e do provider devem ser obtidos dinamicamente
 * (por exemplo, via contexto ou parâmetros de rota).
 */
export default function NegociacaoPage() {
  // Recupera o token JWT armazenado no localStorage
  const token = localStorage.getItem('token');

  // Estados para gerenciar os dados da proposta inicial (iniciado pelo Buyer)
  const [propostaInicial, setPropostaInicial] = useState({ novoPreco: '', novoPrazo: '', observacoes: '' });
  // Estados para gerenciar a resposta do Provider
  const [respostaProvider, setRespostaProvider] = useState({ novoPreco: '', novoPrazo: '', observacoes: '' });
  // Estado para armazenar os detalhes da negociação (quando iniciada)
  const [negociacao, setNegociacao] = useState(null);
  // Estado para controlar o carregamento (loading) durante as requisições
  const [loading, setLoading] = useState(false);
  // Estado para armazenar mensagens de erro (se necessário)
  const [error, setError] = useState(null);

  // IDs de exemplo para a contratação e o provider (devem ser substituídos pela lógica real da aplicação)
  const contratacaoId = "CONTRATACAO_EXEMPLO";
  const providerId = "PROVIDER_EXEMPLO";

  /**
   * iniciarNegociacao – Função para o Buyer iniciar a negociação.
   * Verifica se os campos obrigatórios foram preenchidos, envia os dados ao backend
   * e atualiza o estado com a negociação iniciada.
   */
  const iniciarNegociacao = async (e) => {
    e.preventDefault();
    setError(null);

    // Validação básica: preço e prazo são obrigatórios
    if (!propostaInicial.novoPreco || !propostaInicial.novoPrazo) {
      setError('Informe os ajustes iniciais: preço e prazo.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/negociacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contratacaoId,
          providerId,
          propostaInicial: {
            novoPreco: Number(propostaInicial.novoPreco),
            novoPrazo: propostaInicial.novoPrazo,
            observacoes: propostaInicial.observacoes
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        // Atualiza o estado da negociação com os dados retornados
        setNegociacao(data.negociacao);
      } else {
        setError(data.message || 'Falha ao iniciar a negociação.');
      }
    } catch (err) {
      console.error('Erro ao iniciar negociação:', err);
      setError('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * responderNegociacao – Função para o Provider responder à negociação com uma contra-proposta.
   * Verifica se os campos obrigatórios foram preenchidos e envia os dados para atualizar a negociação.
   */
  const responderNegociacao = async (e) => {
    e.preventDefault();
    setError(null);

    if (!respostaProvider.novoPreco || !respostaProvider.novoPrazo) {
      setError('Informe os ajustes propostos pelo provider.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/negociacao/${negociacao._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          respostaProvider: {
            novoPreco: Number(respostaProvider.novoPreco),
            novoPrazo: respostaProvider.novoPrazo,
            observacoes: respostaProvider.observacoes
          },
          status: 'counter-proposta'
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        // Atualiza o estado da negociação com a resposta do provider
        setNegociacao(data.negociacao);
      } else {
        setError(data.message || 'Falha ao enviar a resposta.');
      }
    } catch (err) {
      console.error('Erro ao responder negociação:', err);
      setError('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * confirmarNegociacao – Função para o Buyer confirmar a negociação.
   * Envia uma requisição para confirmar os ajustes acordados na negociação.
   */
  const confirmarNegociacao = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/negociacao/${negociacao._id}/confirmar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        // Atualiza o estado com os detalhes finais da negociação
        setNegociacao(data.negociacao);
      } else {
        setError(data.message || 'Falha ao confirmar a negociação.');
      }
    } catch (err) {
      console.error('Erro ao confirmar negociação:', err);
      setError('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Negociação de Ajustes</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!negociacao && (
        // Formulário para o Buyer iniciar a negociação
        <form onSubmit={iniciarNegociacao}>
          <h3>Proposta Inicial (Buyer)</h3>
          <input
            type="number"
            placeholder="Novo Preço"
            value={propostaInicial.novoPreco}
            onChange={(e) =>
              setPropostaInicial({ ...propostaInicial, novoPreco: e.target.value })
            }
          /><br/>
          <input
            type="text"
            placeholder="Novo Prazo"
            value={propostaInicial.novoPrazo}
            onChange={(e) =>
              setPropostaInicial({ ...propostaInicial, novoPrazo: e.target.value })
            }
          /><br/>
          <textarea
            placeholder="Observações"
            value={propostaInicial.observacoes}
            onChange={(e) =>
              setPropostaInicial({ ...propostaInicial, observacoes: e.target.value })
            }
          /><br/>
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando proposta...' : 'Iniciar Negociação'}
          </button>
        </form>
      )}

      {negociacao && (
        <div style={{ marginTop: '20px' }}>
          <h3>Detalhes da Negociação</h3>
          <p>
            <strong>Proposta Inicial:</strong> Preço: {negociacao.propostaInicial.novoPreco}, Prazo: {negociacao.propostaInicial.novoPrazo}
          </p>
          {negociacao.respostaProvider && (
            <p>
              <strong>Resposta do Provider:</strong> Preço: {negociacao.respostaProvider.novoPreco}, Prazo: {negociacao.respostaProvider.novoPrazo}
            </p>
          )}
          <p>
            <strong>Status:</strong> {negociacao.status}
          </p>

          {/* Formulário para o Provider responder à negociação */}
          <div style={{ marginTop: '20px' }}>
            <h3>Responder à Negociação (Provider)</h3>
            <form onSubmit={responderNegociacao}>
              <input
                type="number"
                placeholder="Novo Preço"
                value={respostaProvider.novoPreco}
                onChange={(e) =>
                  setRespostaProvider({ ...respostaProvider, novoPreco: e.target.value })
                }
              /><br/>
              <input
                type="text"
                placeholder="Novo Prazo"
                value={respostaProvider.novoPrazo}
                onChange={(e) =>
                  setRespostaProvider({ ...respostaProvider, novoPrazo: e.target.value })
                }
              /><br/>
              <textarea
                placeholder="Observações"
                value={respostaProvider.observacoes}
                onChange={(e) =>
                  setRespostaProvider({ ...respostaProvider, observacoes: e.target.value })
                }
              /><br/>
              <button type="submit" disabled={loading}>
                {loading ? 'Enviando resposta...' : 'Enviar Resposta'}
              </button>
            </form>
          </div>

          {/* Botão para o Buyer confirmar a negociação (caso a negociação esteja em counter-proposta) */}
          <div style={{ marginTop: '20px' }}>
            <h3>Confirmar Negociação (Buyer)</h3>
            <button onClick={confirmarNegociacao} disabled={loading}>
              {loading ? 'Confirmando...' : 'Confirmar Ajustes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
