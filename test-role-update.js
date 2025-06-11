// Script para testar a funcionalidade de atualização de papéis
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// URL base da API
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Função para fazer login e obter um token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      senha: password
    });
    
    console.log('Login bem-sucedido!');
    return response.data.token;
  } catch (error) {
    console.error('Erro ao fazer login:', error.response?.data || error.message);
    throw error;
  }
}

// Função para obter o perfil do usuário
async function getProfile(token) {
  try {
    const response = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Perfil obtido com sucesso!');
    return response.data.user;
  } catch (error) {
    console.error('Erro ao obter perfil:', error.response?.data || error.message);
    throw error;
  }
}

// Função para atualizar os papéis do usuário
async function updateRoles(token, roles) {
  try {
    const response = await axios.put(
      `${API_URL}/auth/profile/roles`,
      { roles },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Papéis atualizados com sucesso!');
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar papéis:', error.response?.data || error.message);
    throw error;
  }
}

// Função principal para testar a atualização de papéis
async function testRoleUpdate() {
  try {
    // Credenciais de teste (substitua por credenciais válidas)
    const email = 'teste@example.com';
    const password = 'Senha123';
    
    // Faz login para obter o token
    const token = await login(email, password);
    
    // Obtém o perfil do usuário para ver os papéis atuais
    const user = await getProfile(token);
    console.log('Papéis atuais:', user.roles);
    
    // Define novos papéis para teste
    // Alterna entre diferentes combinações para testar
    let newRoles;
    if (user.roles.includes('comprador') && user.roles.includes('prestador')) {
      // Se já tem comprador e prestador, adiciona anunciante
      newRoles = [...user.roles, 'anunciante'].filter((v, i, a) => a.indexOf(v) === i);
    } else if (user.roles.includes('anunciante')) {
      // Se já tem anunciante, remove anunciante e adiciona comprador e prestador
      newRoles = ['comprador', 'prestador'];
    } else {
      // Caso contrário, adiciona comprador e anunciante
      newRoles = ['comprador', 'anunciante'];
    }
    
    console.log('Novos papéis a serem definidos:', newRoles);
    
    // Atualiza os papéis
    const result = await updateRoles(token, newRoles);
    console.log('Resultado da atualização:', result);
    
    // Obtém o perfil novamente para verificar se os papéis foram atualizados
    const updatedUser = await getProfile(token);
    console.log('Papéis após atualização:', updatedUser.roles);
    
    // Verifica se as flags booleanas foram atualizadas corretamente
    console.log('isComprador:', updatedUser.isComprador);
    console.log('isPrestador:', updatedUser.isPrestador);
    console.log('isAnunciante:', updatedUser.isAnunciante);
    
    // Verifica se os papéis foram atualizados corretamente
    const rolesMatch = JSON.stringify(updatedUser.roles.sort()) === JSON.stringify(newRoles.sort());
    console.log('Os papéis foram atualizados corretamente?', rolesMatch ? 'SIM' : 'NÃO');
    
    // Verifica se as flags booleanas correspondem aos papéis
    const flagsMatch = 
      updatedUser.isComprador === newRoles.includes('comprador') &&
      updatedUser.isPrestador === newRoles.includes('prestador') &&
      updatedUser.isAnunciante === newRoles.includes('anunciante');
    console.log('As flags booleanas correspondem aos papéis?', flagsMatch ? 'SIM' : 'NÃO');
    
    if (rolesMatch && flagsMatch) {
      console.log('TESTE BEM-SUCEDIDO: A atualização de papéis está funcionando corretamente!');
    } else {
      console.log('TESTE FALHOU: A atualização de papéis não está funcionando corretamente.');
    }
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executa o teste
testRoleUpdate();