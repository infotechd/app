// eslint.config.mjs (JavaScript ESM - Flat Config)

// Importa configurações/plugins necessários
import js from '@eslint/js'; // Regras recomendadas base do ESLint
import tsParser from '@typescript-eslint/parser'; // Parser para TypeScript
import tsPlugin from '@typescript-eslint/eslint-plugin'; // Plugin com regras TypeScript
import reactPlugin from 'eslint-plugin-react'; // Plugin com regras React
import jsxRuntimePlugin from 'eslint-plugin-react/configs/jsx-runtime.js'; // Config para novo JSX runtime (React 17+)
import reactHooksPlugin from 'eslint-plugin-react-hooks'; // Plugin com regras para React Hooks
import prettierPlugin from 'eslint-plugin-prettier'; // Plugin para integrar Prettier
import configPrettier from 'eslint-config-prettier'; // Configuração para DESATIVAR regras ESLint conflitantes com Prettier
import globals from 'globals'; // Pacote para definir variáveis globais (browser, node, etc.)

// NOTA: Certifique-se de ter instalado todas as dependências:
// npm install --save-dev eslint @eslint/js typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-prettier eslint-config-prettier globals
// ou usando yarn:
// yarn add --dev eslint @eslint/js typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-prettier eslint-config-prettier globals

export default [
  // 1. Configuração Global de Linguagem e Ambiente
  {
    files: ['**/*.{js,jsx,ts,tsx}'], // Aplica a todos os arquivos JS/TS/JSX/TSX no projeto
    languageOptions: {
      parser: tsParser, // Usa o parser do TypeScript
      parserOptions: {
        ecmaVersion: 'latest', // Suporta a sintaxe mais recente do ECMAScript
        sourceType: 'module',  // Habilita módulos ES
        ecmaFeatures: {
          jsx: true, // Habilita parsing de JSX
        },
      },
      // Define variáveis globais comuns para diferentes ambientes
      globals: {
        ...globals.browser, // Globais do ambiente de navegador (para frontend/web)
        ...globals.node,    // Globais do ambiente Node.js (para backend)
        ...globals.es2021,  // Globais do ES2021
        // Adicione aqui quaisquer outras globais específicas do projeto, se necessário
        // Ex: Para React Native, 'global' já pode estar coberto, mas pode precisar de outros.
      },
    },
    // Configurações do plugin React (ex: versão)
    settings: {
      react: {
        version: 'detect', // Detecta automaticamente a versão do React instalada
      },
    },
  },

  // 2. Aplica as regras recomendadas base
  js.configs.recommended, // Regras recomendadas do ESLint base

  // 3. Aplica regras recomendadas do TypeScript
  // (Use tsPlugin.configs.recommended ou a variante que preferir - consulte a doc do plugin)
  tsPlugin.configs.recommended, // Regras recomendadas do @typescript-eslint

  // 4. Aplica regras recomendadas do React
  reactPlugin.configs.recommended, // Regras recomendadas do eslint-plugin-react
  jsxRuntimePlugin, // Configuração para o novo JSX Runtime (desativa react/react-in-jsx-scope)

  // 5. Configuração específica para React Hooks
  {
    // Aplica apenas aos arquivos que provavelmente usarão hooks (componentes)
    // Ajuste o padrão se seus componentes não seguirem esta convenção
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Regras essenciais para o uso correto de Hooks
      'react-hooks/rules-of-hooks': 'error',
      // Verifica dependências de hooks como useEffect, useCallback, etc.
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // 6. Desativa regras ESLint conflitantes com Prettier (IMPORTANTE: vir DEPOIS das recomendações)
  configPrettier,

  // 7. Habilita o plugin Prettier para reportar diferenças como erros/avisos ESLint
  {
    // Aplica a todos os arquivos que o Prettier deve formatar
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Avisa sobre código que não segue as regras do Prettier
      'prettier/prettier': 'warn',
    },
  },

  // 8. Customizações e Overrides (Opcional)
  // Adicione aqui quaisquer regras customizadas ou overrides das regras recomendadas
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Exemplo: manter o aviso para variáveis não usadas (já incluído em recommended, mas pode ser explícito)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Ignora args começando com _

      // Adicione outras regras específicas do seu projeto aqui
      // Ex: 'no-console': 'warn', // Avisar sobre console.log em produção
    },
  },

// 9. Configuração específica para Backend (Exemplo Opcional)
// Se precisar de regras específicas para o backend (Node.js)
/*
{
  files: ['backend/**/*.{js,ts}'], // Aplica apenas a arquivos no backend
languageOptions: {
  globals: {
  ...globals.node,
  ...globals.es2021,
  }
},
// Exemplo: adicionar plugin node
// plugins: { node: nodePlugin },
rules: {
  // Regras específicas do Node.js
  // Ex: 'node/no-missing-require': 'error',
}
}
*/

// 10. Ignorar Arquivos (Opcional, mas recomendado)
{
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.expo/**',
    '**/.expo-shared/**',
    '**/coverage/**',
    // Adicione outros padrões a ignorar, se necessário
  ]
}

];