import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * RegisterPage – Página de Cadastro de Usuário.
 * Permite que o usuário se registre fornecendo nome, email, senha, telefone e tipo de usuário.
 * Após o cadastro bem-sucedido, o usuário é redirecionado para a página de login.
 */
export default function RegisterPage() {
  // Estados para armazenar os dados do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  // Tipo de usuário: Buyer, ServiceProvider ou Advertiser. Valor padrão "Buyer"
  const [tipoUsuario, setTipoUsuario] = useState('Buyer');

  // Estados para controlar loading e mensagens de erro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook para navegação
  const navigate = useNavigate();

  /**
   * handleRegister – Função que envia os dados de cadastro para o backend.
   * Realiza validação básica, envia a requisição POST e redireciona o usuário para a página de login em caso de sucesso.
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // Validação básica dos campos obrigatórios
    if (!nome || !email || !senha || !telefone || !tipoUsuario) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      // Envia os dados de cadastro para o endpoint de registro
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, telefone, tipoUsuario })
      });

      const data = await response.json();

      if (response.ok) {
        // Cadastro realizado com sucesso: redireciona para a página de login
        navigate('/login');
      } else {
        // Caso o servidor retorne um erro, exibe a mensagem
        setError(data.message || 'Falha no cadastro.');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setError('Erro na conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Cadastro</h2>
      {/* Exibe mensagem de erro, se houver */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '10px' }}>
          <input 
            placeholder="Nome" 
            value={nome} 
            onChange={(e) => setNome(e.target.value)} 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input 
            placeholder="Senha" 
            type="password" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input 
            placeholder="Telefone" 
            value={telefone} 
            onChange={(e) => setTelefone(e.target.value)} 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <select
            value={tipoUsuario}
            onChange={(e) => setTipoUsuario(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="Buyer">Buyer</option>
            <option value="ServiceProvider">Service Provider</option>
            <option value="Advertiser">Advertiser</option>
          </select>
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
    </div>
  );
}
