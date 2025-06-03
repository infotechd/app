# Configuração do Jest para Testes React Native

Este documento explica as alterações de configuração feitas para corrigir os problemas de configuração do Jest e permitir a execução de testes para o componente UnifiedDashboardScreen.

## Problema

A configuração original do Jest estava usando o preset `jest-expo`, o que estava causando problemas com os módulos do Expo, especificamente com o `EventEmitter` do `expo-modules-core`. A mensagem de erro era:

```
TypeError: Cannot destructure property 'EventEmitter' of 'globalThis.expo' as it is undefined.
```

Além disso, havia problemas com o mock do pacote `@expo/vector-icons`, que é amplamente utilizado no componente UnifiedDashboardScreen.

## Solução

Criamos uma configuração personalizada do Jest que não depende do preset `jest-expo` e faz o mock adequado de todos os módulos necessários. Veja o que fizemos:

1. Criamos um arquivo de configuração personalizado do Jest (`jest.custom.config.js`) que:
   - Usa `jsdom` como ambiente de teste
   - Configura transformIgnorePatterns para permitir a transformação de node_modules específicos
   - Configura moduleNameMapper para fazer mock de módulos problemáticos
   - Usa um arquivo de setup personalizado

2. Criamos um arquivo de setup abrangente (`jest.custom.setup.js`) que:
   - Faz mock do objeto global do Expo
   - Configura polyfills para React Native
   - Faz mock de componentes e APIs do React Native
   - Faz mock de módulos do Expo
   - Faz mock do @expo/vector-icons

3. Criamos um mock para @expo/vector-icons que simplifica o componente MaterialIcons

4. Adicionamos um novo script ao package.json para usar esta configuração personalizada:
   ```json
   "test:custom": "jest --config=jest.custom.config.js"
   ```

## Como Executar os Testes

Para executar testes com a configuração personalizada, use:

```bash
pnpm test:custom src/path/to/test.tsx
```

Por exemplo, para executar o teste simples:

```bash
pnpm test:custom src/__tests__/simple.test.ts
```

## Problemas Conhecidos

Ainda existem alguns desafios ao testar componentes que usam bibliotecas de UI complexas como @expo/vector-icons. A abordagem atual é fazer mock desses componentes para retornar null, o que permite que os testes sejam executados, mas pode não fornecer a cobertura de teste mais precisa.

Para componentes mais complexos, pode ser necessário:

1. Criar mocks mais sofisticados que imitem melhor o comportamento dos componentes reais
2. Usar testes de snapshot em vez de testar elementos específicos
3. Focar em testar a lógica do componente em vez de sua UI

## Próximos Passos

1. Refinar os mocks para componentes de UI para representar melhor seu comportamento
2. Adicionar testes mais abrangentes para o componente UnifiedDashboardScreen
3. Considerar o uso de testes de snapshot para componentes de UI
4. Explorar as capacidades de consulta mais avançadas do React Native Testing Library
