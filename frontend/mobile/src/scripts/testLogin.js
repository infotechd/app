// Script para testar a funcionalidade de login
// Este script pode ser executado com: node testLogin.js

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Carrega variáveis de ambiente do arquivo .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// URL da API
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Função para testar o login
async function testLogin(email, senha) {
  console.log(`\n=== Testando login com email: ${email} ===`);
  
  try {
    // Faz a requisição de login
    console.log(`Enviando requisição para: ${API_URL}/auth/login`);
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      senha
    });
    
    // Verifica se a resposta contém os dados esperados
    console.log('Resposta recebida com status:', response.status);
    
    if (response.data && response.data.token) {
      console.log('✅ Token recebido com sucesso');
    } else {
      console.log('❌ Token não encontrado na resposta');
    }
    
    if (response.data && response.data.user) {
      console.log('✅ Dados do usuário recebidos com sucesso');
      console.log('ID do usuário:', response.data.user.id || response.data.user.idUsuario || 'Não encontrado');
      console.log('Nome do usuário:', response.data.user.nome || 'Não encontrado');
      console.log('Email do usuário:', response.data.user.email || 'Não encontrado');
      
      // Verifica as capacidades do usuário
      const capacidades = [];
      if (response.data.user.isComprador) capacidades.push('Comprador');
      if (response.data.user.isPrestador) capacidades.push('Prestador');
      if (response.data.user.isAnunciante) capacidades.push('Anunciante');
      if (response.data.user.isAdmin) capacidades.push('Admin');
      
      console.log('Capacidades do usuário:', capacidades.length > 0 ? capacidades.join(', ') : 'Nenhuma');
      
      // Verifica se o token está presente no objeto user
      if (response.data.user.token) {
        console.log('✅ Token presente no objeto user');
      } else {
        console.log('❌ Token não encontrado no objeto user');
      }
    } else {
      console.log('❌ Dados do usuário não encontrados na resposta');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erro ao fazer login:');
    
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status de erro
      console.log('Status do erro:', error.response.status);
      console.log('Dados do erro:', error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.log('Sem resposta do servidor. Verifique se o servidor está rodando.');
    } else {
      // Erro na configuração da requisição
      console.log('Erro:', error.message);
    }
    
    return false;
  }
}

// Função principal
async function main() {
  console.log('=== TESTE DE FUNCIONALIDADE DE LOGIN ===');
  console.log('API URL:', API_URL);
  
  // Teste com credenciais válidas
  const validEmail = 'usuario@teste.com';
  const validPassword = 'Senha123';
  
  await testLogin(validEmail, validPassword);
  
  // Teste com email inválido
  await testLogin('email_invalido@teste.com', validPassword);
  
  // Teste com senha inválida
  await testLogin(validEmail, 'senha_invalida');
  
  console.log('\n=== TESTES CONCLUÍDOS ===');
}

// Executa a função principal
main().catch(error => {
  console.error('Erro não tratado:', error);
});