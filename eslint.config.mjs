// eslint.config.mjs (JavaScript ESM - Flat Config - Corrigido)

// Importa configurações/plugins necessários
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
// import jsxRuntimePlugin from 'eslint-plugin-react/configs/jsx-runtime.js'; // REMOVIDO - Não é mais a forma padrão
import reactRecommendedConfig from 'eslint-plugin-react/configs/recommended.js'; // Usar a config recomendada completa
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import globals from 'globals';
// import importPlugin from 'eslint-plugin-import'; // Descomente se usar e tiver instalado

// Nota: Verifique se todas as dependências estão instaladas!

export default [
  // 1. Configuração Global de Linguagem e Ambiente
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true, // Habilita parsing de JSX
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        __DEV__: 'readonly', // Adiciona global __DEV__ comum em RN/Expo
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    // Definindo plugins que serão usados em várias configs
    // (Embora configs importadas como recommended geralmente já os declarem)
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'prettier': prettierPlugin,
      // 'import': importPlugin, // Descomente se usar
    },
  },

  // 2. Aplica as regras recomendadas base do ESLint
  js.configs.recommended,

  // 3. Aplica regras recomendadas do TypeScript (@typescript-eslint)
  // O objeto exportado por tsPlugin.configs.recommended já contém as regras
  tsPlugin.configs.recommended,

  // 4. Aplica regras recomendadas do React (eslint-plugin-react)
  // Usamos o objeto recomendado que já inclui regras e parser/plugin settings
  // Isso geralmente já configura o novo JSX Runtime automaticamente
  reactRecommendedConfig,

  // 5. Configuração específica para React Hooks (já definida acima no objeto #1 via plugins)
  // Aplicando as regras de Hooks explicitamente aqui
  {
    files: ['**/*.{jsx,tsx}'], // Garante que se aplica a arquivos React
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    }
  },


  // 6. Desativa regras ESLint conflitantes com Prettier (IMPORTANTE: DEPOIS das configs recomendadas)
  configPrettier,

  // 7. Habilita o plugin Prettier para reportar diferenças como erros/avisos ESLint
  // (As regras do Prettier já foram adicionadas ao objeto #1 via plugins)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'prettier/prettier': 'warn', // Avisa sobre código que não segue as regras do Prettier
    },
  },

  // 8. Customizações e Overrides Gerais
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Mantém a regra padrão para variáveis não usadas, mas permite ignorar args com _
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_', // Ignora também variáveis não usadas que começam com _
        caughtErrorsIgnorePattern: '^_', // Ignora erros capturados que começam com _
      }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // Ex: Avisar sobre console em produção
      // Adicione outras regras customizadas aqui
    },
  },

  // 9. Override específico para o arquivo 'App'.tsx (ou seu ponto de entrada principal)
  {
    files: ["./frontend/mobile/App.tsx"], // AJUSTE O CAMINHO se App.tsx estiver dentro de src/
    rules: {
      // Ajusta a regra @typescript-eslint/no-unused-vars especificamente para App.tsx
      // para ignorar a variável 'App' usada no export default.
      "@typescript-eslint/no-unused-vars": ["warn", {
        "vars": "all",
        "args": "after-used",
        "ignoreRestSiblings": true,
        "varsIgnorePattern": "^App$", // IGNORA a variável/componente chamado 'App'
        "argsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      // Se você também usa eslint-plugin-import e o erro persiste, descomente a linha abaixo:
      // "import/no-unused-modules": "off",
    }
  },

  // 10. Ignorar Arquivos (Geralmente boa prática colocar no final)
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/.expo-shared/**',
      '**/coverage/**',
      'babel.config.js',
      'metro.config.js', // Comum em projetos RN/Expo
      // Adicione outros padrões a ignorar
    ]
  }
]; // Fim do array principal exportado