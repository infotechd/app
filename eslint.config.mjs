// eslint.config.mjs (JavaScript ESM - Flat Config - Corrigido)

// Importa configurações/plugins necessários
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
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
  // Configuração manual para regras básicas do ESLint em vez de usar o objeto importado
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'off', // Desativado em favor da versão TypeScript
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-duplicate-case': 'error',
      'no-empty': 'warn'
    }
  },

  // 3. Aplica regras recomendadas do TypeScript (@typescript-eslint)
  // Configuração manual para TypeScript em vez de usar o objeto importado
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn'
    }
  },

  // 4. Aplica regras recomendadas do React (eslint-plugin-react)
  // Configuração manual para React em vez de usar o objeto importado
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react': reactPlugin
    },
    rules: {
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'warn'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },

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
  // Configuração manual para Prettier em vez de usar o objeto importado
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Desativa regras que podem conflitar com o Prettier
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
      'quotes': 'off',
      'semi': 'off',
      'indent': 'off',
      'comma-dangle': 'off',
      'max-len': 'off'
    }
  },

  // 7. Habilita o plugin Prettier para reportar diferenças como erros/avisos ESLint
  // (As regras do Prettier já foram adicionadas ao objeto #1 via plugins)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'prettier/prettier': 'off', // Temporariamente desativado enquanto o código é formatado gradualmente
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
      'no-console': 'off', // Desativado para permitir console.log durante o desenvolvimento
      // Adicione outras regras customizadas aqui
    },
  },

  // 9. Override específico para o arquivo 'App'.tsx (ou seu ponto de entrada principal)
  {
    files: ["frontend/mobile/App.tsx"], // Caminho corrigido sem ./ no início
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
