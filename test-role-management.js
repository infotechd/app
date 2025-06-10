// Script de teste para validar a funcionalidade de gerenciamento de papéis (roles)
// Este arquivo contém testes automatizados para verificar se o sistema gerencia corretamente os papéis dos usuários
const axios = require('axios'); // Biblioteca para fazer requisições HTTP
const fs = require('fs'); // Biblioteca para operações de arquivo

// Configuração
const API_URL = 'http://localhost:3000'; // Ajuste para a URL do seu backend
const TOKEN = 'YOUR_AUTH_TOKEN'; // Substitua por um token válido

// Casos de teste para gerenciamento de papéis
// Os testes abaixo verificam diferentes cenários de atribuição e remoção de papéis
const testCases = [
  {
    name: 'Teste 1: Adicionar papel com campos diretos',
    payload: {
      idUsuario: '507f1f77bcf86cd799439011', // Exemplo de MongoDB ObjectId
      roles: ['comprador', 'prestador'],
      isComprador: true,
      isPrestador: true,
      isAnunciante: false
    },
    expectedToPass: true // Espera-se que o teste passe
  },
  {
    name: 'Teste 2: Adicionar papel com objeto de usuário aninhado',
    payload: {
      user: {
        idUsuario: '507f1f77bcf86cd799439011', // Exemplo de MongoDB ObjectId
        roles: ['comprador', 'prestador'],
        isComprador: true,
        isPrestador: true,
        isAnunciante: false
      }
    },
    expectedToPass: true // Espera-se que o teste passe
  },
  {
    name: 'Teste 3: Remover papel com campos diretos',
    payload: {
      idUsuario: '507f1f77bcf86cd799439011', // Exemplo de MongoDB ObjectId
      roles: ['comprador'],
      isComprador: true,
      isPrestador: false,
      isAnunciante: false
    },
    expectedToPass: true // Espera-se que o teste passe
  },
  {
    name: 'Teste 4: Remover papel com objeto de usuário aninhado',
    payload: {
      user: {
        idUsuario: '507f1f77bcf86cd799439011', // Exemplo de MongoDB ObjectId
        roles: ['comprador'],
        isComprador: true,
        isPrestador: false,
        isAnunciante: false
      }
    },
    expectedToPass: true // Espera-se que o teste passe
  }
];

// Função para executar os testes
// Esta função executa cada caso de teste sequencialmente e registra os resultados
async function runTests() {
  console.log('Iniciando testes de validação de gerenciamento de papéis...');
  const results = []; // Array para armazenar os resultados dos testes

  // Itera sobre cada caso de teste
  for (const test of testCases) {
    console.log(`\nExecutando ${test.name}`);
    console.log('Payload:', JSON.stringify(test.payload, null, 2));

    try {
      // Faz uma requisição PUT para a API de atualização de perfil
      const response = await axios.put(`${API_URL}/auth/profile`, test.payload, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`, // Token de autenticação
          'Content-Type': 'application/json' // Tipo de conteúdo da requisição
        }
      });

      // Exibe o status e a resposta da requisição
      console.log('Status:', response.status);
      console.log('Resposta:', JSON.stringify(response.data, null, 2));

      // Registra o resultado do teste bem-sucedido
      results.push({
        name: test.name,
        passed: true, // O teste passou
        expected: test.expectedToPass, // Resultado esperado
        match: true === test.expectedToPass, // Verifica se o resultado corresponde ao esperado
        response: response.data // Dados da resposta
      });
    } catch (error) {
      // Exibe informações sobre o erro em caso de falha
      console.log('Erro:', error.response ? error.response.status : error.message);
      console.log('Dados do erro:', error.response ? JSON.stringify(error.response.data, null, 2) : 'Sem dados de resposta');

      // Registra o resultado do teste com falha
      results.push({
        name: test.name,
        passed: false, // O teste falhou
        expected: test.expectedToPass, // Resultado esperado
        match: false === test.expectedToPass, // Verifica se o resultado corresponde ao esperado
        error: error.response ? error.response.data : error.message // Detalhes do erro
      });
    }
  }

  // Resumo dos resultados
  console.log('\n=== RESUMO DOS RESULTADOS DOS TESTES ===');
  for (const result of results) {
    const status = result.match ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${status} - ${result.name}`);
    console.log(`  Esperado passar: ${result.expected}, Atual: ${result.passed}`);
  }

  // Salva os resultados em um arquivo
  fs.writeFileSync('test-role-results.json', JSON.stringify(results, null, 2));
  console.log('\nResultados dos testes salvos em test-role-results.json');
}

// Executa os testes
// Chama a função runTests e trata qualquer erro que possa ocorrer durante a execução
runTests().catch(error => {
  console.error('Falha na execução do teste:', error);
});

// Instruções de uso:
// 1. Substitua YOUR_AUTH_TOKEN por um token de autenticação válido
// 2. Ajuste API_URL se seu backend estiver rodando em uma URL diferente
// 3. Execute este script com Node.js: node test-role-management.js
// 4. Verifique a saída do console e o arquivo test-role-results.json para os resultados
