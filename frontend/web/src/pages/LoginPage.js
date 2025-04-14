import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * LoginPage – Página de Login para a aplicação Web.
 * Permite que o usuário insira email e senha para realizar o login.
 * O token JWT é armazenado de forma segura (em cookie HttpOnly) pelo backend.
 */
export default function LoginPage() {
  // Estados para armazenar os dados do formulário
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook para navegação após o login bem-sucedido
  const navigate = useNavigate();

  /**
   * handleLogin – Função que processa o login do usuário.
   * Valida os campos obrigatórios, envia a requisição para o backend
   * e redireciona o usuário em caso de sucesso.
   */
  const handleLogin = async (e) => {
    e.preventDefault();

    // Validação básica: email e senha devem ser preenchidos
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Envia a requisição POST para o endpoint de login
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (response.ok) {
        // Login realizado com sucesso; o token JWT é armazenado em cookie HttpOnly pelo backend.
        // Redireciona o usuário para a página inicial ou outra rota desejada.
        navigate('/');
      } else {
        // Exibe mensagem de erro se o login falhar
        setError(data.message || 'Falha no login.');
      }
    } catch (error) {
      console.error('Erro na requisição de login:', error);
      setError('Erro na conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Login Web</h2>
      <form onSubmit={handleLogin}>
        <input 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        /><br />
        <input 
          placeholder="Senha" 
          type="password" 
          value={senha} 
          onChange={(e) => setSenha(e.target.value)} 
        /><br />
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {error && (
        <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
      )}
    </div>
  );
}
