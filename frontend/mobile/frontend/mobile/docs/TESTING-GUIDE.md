# Guia de Testes para o Aplicativo Mobile

Este documento fornece orientações sobre como escrever e executar testes no aplicativo mobile, com foco em resolver problemas comuns e melhorar a eficiência dos testes.

## Configuração do Jest

O projeto utiliza Jest com configurações personalizadas para testes de componentes React Native:

- `jest.config.js`: Configuração padrão do Jest
- `jest.custom.config.js`: Configuração personalizada para testes de componentes
- `jest.custom.setup.js`: Configuração de mocks e polyfills para o ambiente de teste

### Executando os Testes

Para executar os testes, use os seguintes comandos:

```bash
# Executar todos os testes
pnpm test

# Executar testes com a configuração personalizada
pnpm test:custom

# Executar um arquivo de teste específico
pnpm test:custom src/screens/__tests__/NomeDoArquivo.test.tsx
```

## Boas Práticas para Testes

### 1. Priorize os Testes Críticos

Nem todos os testes têm a mesma importância. Priorize:

- Testes de estados básicos (carregamento, erro, vazio)
- Testes de funcionalidades críticas para o negócio
- Testes de fluxos de usuário principais

Use `test.skip()` para desativar temporariamente testes menos críticos:

```typescript
// Teste crítico
test('renders loading state correctly', () => {
  // ...
});

// Teste menos crítico
test.skip('formats currency correctly', () => {
  // ...
});
```

### 2. Simplifique os Testes Complexos

Divida testes grandes em unidades menores e mais focadas:

- Agrupe testes relacionados com `describe()`
- Teste um aspecto por vez
- Evite testes que verificam muitos comportamentos diferentes

Exemplo:

```typescript
// Antes: Um teste grande testando muitas coisas
test('renders offer details correctly', async () => {
  // ... muitas verificações
});

// Depois: Testes menores e focados
describe('Offer Details', () => {
  test('renders basic offer information', async () => {
    // ... verificações básicas
  });
  
  test('renders price correctly', async () => {
    // ... verificações de preço
  });
  
  test('renders availability information', async () => {
    // ... verificações de disponibilidade
  });
});
```

### 3. Mocks Eficientes

Crie mocks que simulem corretamente o comportamento dos componentes e APIs:

- Use funções que retornam componentes React para mocks de componentes visuais
- Configure valores padrão realistas para os mocks
- Evite mocks excessivamente complexos

### 4. Lidando com Atualizações Assíncronas

Para evitar avisos de "act()", use:

- `findByText` em vez de `getByText` para elementos que aparecem após operações assíncronas
- `waitFor` para aguardar que condições sejam satisfeitas
- `act` para envolver operações que causam atualizações de estado

## Solução de Problemas Comuns

### Avisos de "act()"

Se você vir avisos como "An update to Component inside a test was not wrapped in act(...)":

1. Use `findByText` ou outras funções "find" para elementos que aparecem após operações assíncronas
2. Envolva operações que causam atualizações de estado em `act()`
3. Use `waitFor` para aguardar que condições sejam satisfeitas

### Problemas com Mocks de Componentes

Se os componentes mockados não estiverem funcionando corretamente:

1. Verifique se o mock está retornando um componente React válido
2. Para ícones e outros componentes visuais, use funções que retornam `null`
3. Certifique-se de que o mock está sendo aplicado antes da renderização do componente

### Testes Lentos

Se os testes estiverem demorando muito para executar:

1. Reduza o número de testes executados de uma vez
2. Simplifique os componentes renderizados
3. Use mocks eficientes para APIs e componentes externos

## Recursos Adicionais

- [Documentação do Jest](https://jestjs.io/docs/getting-started)
- [Documentação do React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Guia de Testes do React Native](https://reactnative.dev/docs/testing-overview)