// Script de teste para validar o comportamento do backend com atualizações de perfil
// Este arquivo contém testes automatizados para verificar como o backend lida com diferentes formatos de dados de atualização de perfil
const axios = require('axios'); // Importa a biblioteca axios para fazer requisições HTTP
const fs = require('fs'); // Importa a biblioteca fs (file system) para operações de arquivo

// Configuração
const API_URL = 'http://localhost:3000'; // Ajuste para a URL do seu backend
const TOKEN = 'YOUR_AUTH_TOKEN'; // Substitua por um token válido

// Casos de teste
// Define diferentes cenários para testar a atualização de perfil
const testCases = [
  {
    name: 'Teste 1: Campos diretos sem ID', // Teste com campos diretos sem ID (deve falhar)
    payload: {
      nome: 'Test User',
      isComprador: true
    },
    expectedToPass: false // Espera-se que falhe pois não tem ID
  },
  {
    name: 'Teste 2: Campos diretos com ID', // Teste com campos diretos com ID (deve passar)
    payload: {
      idUsuario: '507f1f77bcf86cd799439011', // Exemplo de ObjectId do MongoDB
      nome: 'Test User',
      isComprador: true
    },
    expectedToPass: true // Espera-se que passe pois tem ID
  },
  {
    name: 'Teste 3: Objeto de usuário aninhado sem ID', // Teste com objeto aninhado sem ID (deve falhar)
    payload: {
      user: {
        nome: 'Test User',
        isComprador: true
      }
    },
    expectedToPass: false // Espera-se que falhe pois não tem ID
  },
  {
    name: 'Teste 4: Objeto de usuário aninhado com ID', // Teste com objeto aninhado com ID (deve passar)
    payload: {
      user: {
        idUsuario: '507f1f77bcf86cd799439011', // Exemplo de ObjectId do MongoDB
        nome: 'Test User',
        isComprador: true
      }
    },
    expectedToPass: true // Espera-se que passe pois tem ID
  }
];

// Função para executar os testes
// Esta função executa cada caso de teste e registra os resultados
async function runTests() {
  console.log('Iniciando testes de validação de atualização de perfil...');
  const results = []; // Array para armazenar os resultados dos testes

  // Itera sobre cada caso de teste
  for (const test of testCases) {
    console.log(`\nExecutando ${test.name}`);
    console.log('Payload:', JSON.stringify(test.payload, null, 2));

    try {
      // Faz uma requisição PUT para a API de atualização de perfil
      const response = await axios.put(`${API_URL}/auth/profile`, test.payload, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`, // Cabeçalho de autorização
          'Content-Type': 'application/json' // Tipo de conteúdo
        }
      });

      // Exibe informações sobre a resposta
      console.log('Status:', response.status);
      console.log('Resposta:', JSON.stringify(response.data, null, 2));

      // Adiciona o resultado do teste ao array de resultados
      results.push({
        name: test.name, // Nome do teste
        passed: true, // O teste passou (não houve erro)
        expected: test.expectedToPass, // Resultado esperado
        match: true === test.expectedToPass, // Verifica se o resultado corresponde ao esperado
        response: response.data // Dados da resposta
      });
    } catch (error) {
      // Em caso de erro na requisição
      console.log('Erro:', error.response ? error.response.status : error.message);
      console.log('Dados do erro:', error.response ? JSON.stringify(error.response.data, null, 2) : 'Sem dados de resposta');

      // Adiciona o resultado do teste com falha ao array de resultados
      results.push({
        name: test.name, // Nome do teste
        passed: false, // O teste falhou (houve erro)
        expected: test.expectedToPass, // Resultado esperado
        match: false === test.expectedToPass, // Verifica se o resultado corresponde ao esperado
        error: error.response ? error.response.data : error.message // Dados do erro
      });
    }
  }

  // Resumo dos resultados
  console.log('\n=== RESUMO DOS RESULTADOS DOS TESTES ===');
  for (const result of results) {
    // Determina o status do teste (passou ou falhou)
    const status = result.match ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${status} - ${result.name}`);
    console.log(`  Esperado passar: ${result.expected}, Resultado real: ${result.passed}`);
  }

  // Salva os resultados em um arquivo
  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  console.log('\nResultados dos testes salvos em test-results.json');
}

// Executa os testes
// Chama a função runTests e trata qualquer erro que possa ocorrer durante a execução
runTests().catch(error => {
  console.error('Falha na execução dos testes:', error);
});

// Instruções de uso:
// 1. Substitua YOUR_AUTH_TOKEN por um token de autenticação válido
// 2. Ajuste API_URL se seu backend estiver rodando em uma URL diferente
// 3. Execute este script com Node.js: node test-profile-update.js
// 4. Verifique a saída do console e o arquivo test-results.json para os resultados
