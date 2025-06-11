// Script de teste para validar a funcionalidade de gerenciamento de papéis (roles)
// Este arquivo contém testes automatizados para verificar se o sistema gerencia corretamente os papéis dos usuários
const axios = require('axios'); // Biblioteca para fazer requisições HTTP
const fs = require('fs'); // Biblioteca para operações de arquivo
const dotenv = require('dotenv'); // Biblioteca para carregar variáveis de ambiente
dotenv.config(); // Carrega variáveis de ambiente do arquivo .env

// Configuração
const API_URL = process.env.API_URL || 'http://localhost:3000/api'; // Ajuste para a URL do seu backend
const TOKEN = process.env.AUTH_TOKEN || 'YOUR_AUTH_TOKEN'; // Substitua por um token válido

// Para obter um token válido, você pode:
// 1. Fazer login manualmente na aplicação e copiar o token do localStorage ou SecureStore
// 2. Usar o script test-login.js para fazer login e obter um token
// 3. Definir a variável de ambiente AUTH_TOKEN no arquivo .env

console.log('=== TESTE DE GERENCIAMENTO DE PAPÉIS ===');
console.log('API URL:', API_URL);
console.log('Token disponível:', TOKEN ? 'Sim' : 'Não');

if (!TOKEN || TOKEN === 'YOUR_AUTH_TOKEN') {
  console.error('ERRO: Token não fornecido. Execute o script test-login.js primeiro ou defina AUTH_TOKEN no arquivo .env');
  process.exit(1);
}

// Casos de teste para gerenciamento de papéis
// Os testes abaixo verificam diferentes cenários de atribuição e remoção de papéis
const testCases = [
  {
    name: 'Teste 1: Definir papéis como comprador e prestador',
    payload: {
      roles: ['comprador', 'prestador']
    },
    expectedToPass: true // Espera-se que o teste passe
  },
  {
    name: 'Teste 2: Definir papel como apenas comprador',
    payload: {
      roles: ['comprador']
    },
    expectedToPass: true // Espera-se que o teste passe
  },
  {
    name: 'Teste 3: Definir papel como apenas prestador',
    payload: {
      roles: ['prestador']
    },
    expectedToPass: true // Espera-se que o teste passe
  },
  {
    name: 'Teste 4: Definir papel como apenas anunciante',
    payload: {
      roles: ['anunciante']
    },
    expectedToPass: true // Espera-se que o teste passe
  },
  {
    name: 'Teste 5: Definir todos os papéis',
    payload: {
      roles: ['comprador', 'prestador', 'anunciante']
    },
    expectedToPass: true // Espera-se que o teste passe
  },
  {
    name: 'Teste 6: Tentar definir sem papéis (deve falhar)',
    payload: {
      roles: []
    },
    expectedToPass: false // Espera-se que o teste falhe
  }
];

// Função para obter o perfil do usuário atual
async function getProfile() {
  try {
    console.log('\nObtendo perfil do usuário...');
    const response = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    console.log('Perfil obtido com sucesso!');
    console.log('Papéis atuais:', response.data.user.roles);
    console.log('isComprador:', response.data.user.isComprador);
    console.log('isPrestador:', response.data.user.isPrestador);
    console.log('isAnunciante:', response.data.user.isAnunciante);

    return response.data.user;
  } catch (error) {
    console.error('Erro ao obter perfil:', error.response?.data || error.message);
    throw error;
  }
}

// Função para executar os testes
// Esta função executa cada caso de teste sequencialmente e registra os resultados
async function runTests() {
  console.log('\n=== INICIANDO TESTES DE VALIDAÇÃO DE GERENCIAMENTO DE PAPÉIS ===');
  const results = []; // Array para armazenar os resultados dos testes

  // Obtém o perfil inicial do usuário para referência
  let initialProfile;
  try {
    initialProfile = await getProfile();
    console.log('\nPerfil inicial do usuário obtido com sucesso.');
  } catch (error) {
    console.error('Erro ao obter perfil inicial. Abortando testes.');
    process.exit(1);
  }

  // Itera sobre cada caso de teste
  for (const test of testCases) {
    console.log(`\n=== EXECUTANDO ${test.name} ===`);
    console.log('Payload:', JSON.stringify(test.payload, null, 2));

    try {
      // Faz uma requisição PUT para a API de atualização de papéis
      console.log('Enviando requisição para atualizar papéis...');
      const response = await axios.put(`${API_URL}/auth/profile/roles`, test.payload, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`, // Token de autenticação
          'Content-Type': 'application/json' // Tipo de conteúdo da requisição
        }
      });

      // Exibe o status e a resposta da requisição
      console.log('Status da resposta:', response.status);
      console.log('Resposta:', JSON.stringify(response.data, null, 2));

      // Obtém o perfil atualizado para verificar se os papéis foram atualizados corretamente
      const updatedProfile = await getProfile();

      // Verifica se os papéis foram atualizados corretamente
      const rolesMatch = JSON.stringify(updatedProfile.roles.sort()) === JSON.stringify(test.payload.roles.sort());

      // Verifica se as flags booleanas correspondem aos papéis
      const flagsMatch = 
        updatedProfile.isComprador === test.payload.roles.includes('comprador') &&
        updatedProfile.isPrestador === test.payload.roles.includes('prestador') &&
        updatedProfile.isAnunciante === test.payload.roles.includes('anunciante');

      console.log('Papéis atualizados corretamente?', rolesMatch ? 'SIM ✅' : 'NÃO ❌');
      console.log('Flags booleanas correspondem aos papéis?', flagsMatch ? 'SIM ✅' : 'NÃO ❌');

      // Registra o resultado do teste bem-sucedido
      results.push({
        name: test.name,
        passed: true, // O teste passou
        expected: test.expectedToPass, // Resultado esperado
        match: true === test.expectedToPass, // Verifica se o resultado corresponde ao esperado
        rolesMatch,
        flagsMatch,
        response: response.data, // Dados da resposta
        updatedProfile // Perfil atualizado
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

    // Pequena pausa entre os testes para evitar sobrecarga da API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Restaura os papéis originais do usuário
  try {
    console.log('\n=== RESTAURANDO PAPÉIS ORIGINAIS DO USUÁRIO ===');
    await axios.put(`${API_URL}/auth/profile/roles`, { roles: initialProfile.roles }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Papéis originais restaurados com sucesso!');
    await getProfile(); // Exibe o perfil final para confirmar
  } catch (error) {
    console.error('Erro ao restaurar papéis originais:', error.response?.data || error.message);
  }

  // Resumo dos resultados
  console.log('\n=== RESUMO DOS RESULTADOS DOS TESTES ===');
  let passedCount = 0;
  let failedCount = 0;

  for (const result of results) {
    const status = result.match ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`${status} - ${result.name}`);
    console.log(`  Esperado passar: ${result.expected}, Atual: ${result.passed}`);

    if (result.passed) {
      if (result.rolesMatch && result.flagsMatch) {
        console.log('  Papéis e flags atualizados corretamente ✅');
      } else {
        console.log('  Problemas na atualização:');
        if (!result.rolesMatch) console.log('    - Papéis não foram atualizados corretamente ❌');
        if (!result.flagsMatch) console.log('    - Flags booleanas não correspondem aos papéis ❌');
      }
    }

    if (result.match) passedCount++;
    else failedCount++;
  }

  console.log(`\nTestes passados: ${passedCount}/${results.length}`);
  console.log(`Testes falhos: ${failedCount}/${results.length}`);

  // Salva os resultados em um arquivo
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `test-role-results-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\nResultados dos testes salvos em ${filename}`);

  return passedCount === results.length;
}

// Executa os testes
// Chama a função runTests e trata qualquer erro que possa ocorrer durante a execução
(async () => {
  try {
    console.log('\n=== INICIANDO TESTE COMPLETO DE GERENCIAMENTO DE PAPÉIS ===');
    console.log('Data e hora:', new Date().toLocaleString());
    console.log('Ambiente:', process.env.NODE_ENV || 'development');

    const startTime = Date.now();
    const success = await runTests();
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // em segundos

    console.log('\n=== RESULTADO FINAL ===');
    console.log(`Duração total dos testes: ${duration.toFixed(2)} segundos`);

    if (success) {
      console.log('\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
      console.log('O botão "Salvar Alterações" está funcionando corretamente.');
      console.log('As correções implementadas resolveram o problema.');
    } else {
      console.log('\n❌ ALGUNS TESTES FALHARAM!');
      console.log('O botão "Salvar Alterações" ainda pode ter problemas.');
      console.log('Revise as correções implementadas e tente novamente.');
    }

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ FALHA CRÍTICA NA EXECUÇÃO DOS TESTES:', error);
    process.exit(1);
  }
})();

// Instruções de uso:
// 1. Execute o script test-login.js primeiro para obter um token válido:
//    node test-login.js
// 2. Verifique se o arquivo .env contém a variável AUTH_TOKEN
// 3. Execute este script:
//    node test-role-management.js
// 4. Verifique a saída do console e o arquivo de resultados gerado
