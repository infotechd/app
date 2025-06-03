# Testes de Lógica para UnifiedDashboardScreen

Este documento descreve os testes de lógica implementados para o componente `UnifiedDashboardScreen.tsx`.

## Visão Geral

O arquivo `UnifiedDashboardScreen.logic.test.tsx` contém testes focados especificamente na lógica do componente `UnifiedDashboardScreen`, complementando os testes unitários e de integração existentes. Estes testes verificam o comportamento da função `toggleUserRole` e suas interações com o serviço de API, bem como o comportamento do componente com diferentes combinações de papéis de usuário.

## Casos de Teste Implementados

Os seguintes casos de teste foram implementados:

1. **Ativação de papel de usuário**
   - Verifica se a função `toggleUserRole` ativa corretamente um papel de usuário
   - Verifica se `updateProfile` é chamada com os parâmetros corretos
   - Verifica se `updateUser` é chamada com os dados atualizados do usuário
   - Verifica se o alerta de sucesso é exibido

2. **Desativação de papel de usuário**
   - Verifica se a função `toggleUserRole` desativa corretamente um papel de usuário
   - Verifica se `updateProfile` é chamada com os parâmetros corretos
   - Verifica se `updateUser` é chamada com os dados atualizados do usuário
   - Verifica se o alerta de sucesso é exibido

3. **Tratamento de erros de API**
   - Verifica se a função `toggleUserRole` trata corretamente erros da API
   - Verifica se o alerta de erro é exibido quando a API retorna um erro

4. **Atualização do papel ativo ao ativar um papel**
   - Verifica se a função `toggleUserRole` atualiza corretamente o papel ativo na interface quando um papel é ativado
   - Verifica se a seção correspondente ao papel ativado é expandida

5. **Atualização do papel ativo ao desativar o papel ativo**
   - Verifica se a função `toggleUserRole` atualiza corretamente o papel ativo na interface quando o papel ativo é desativado
   - Verifica se outra seção é expandida quando o papel ativo é desativado

6. **Tratamento de resposta incompleta da API**
   - Verifica se a função `toggleUserRole` trata corretamente respostas incompletas da API
   - Verifica se `updateUser` é chamada apenas com a atualização do papel quando a resposta da API não inclui dados completos do usuário

7. **Renderização com diferentes combinações de papéis de usuário**
   - Verifica se o componente renderiza corretamente com diferentes combinações de papéis de usuário
   - Testa com apenas o papel de comprador ativo
   - Testa com apenas o papel de prestador ativo
   - Testa com apenas o papel de anunciante ativo
   - Testa com apenas o papel de admin ativo

## Como Executar os Testes

Para executar os testes de lógica, use o seguinte comando:

```bash
pnpm test:custom src/screens/__tests__/UnifiedDashboardScreen.logic.test.tsx
```

Este comando usa a configuração personalizada do Jest definida em `jest.custom.config.js`.

## Diferenças em Relação aos Testes Existentes

Estes testes de lógica complementam os testes unitários e de integração existentes das seguintes maneiras:

1. **Foco na lógica do componente**: Enquanto os testes unitários se concentram na renderização e os testes de integração na interação com o contexto de autenticação, estes testes focam especificamente na lógica de negócios do componente.

2. **Testes mais detalhados da função toggleUserRole**: Estes testes verificam mais casos de uso e comportamentos da função `toggleUserRole`, incluindo casos de borda e tratamento de erros.

3. **Testes com diferentes combinações de papéis**: Estes testes verificam o comportamento do componente com várias combinações de papéis de usuário, garantindo que a interface se adapte corretamente a diferentes configurações de usuário.

4. **Verificação da atualização do papel ativo**: Estes testes verificam especificamente como o papel ativo na interface é atualizado quando papéis são ativados ou desativados.

## Notas sobre a Implementação

Os testes de lógica foram implementados seguindo o padrão usado em outros testes do projeto. Eles usam:

1. **Mocks para dependências externas**:
   - API functions (updateProfile)
   - Alert.alert
   - useAuth hook

2. **Renderização do componente com diferentes configurações**:
   - Diferentes combinações de papéis de usuário
   - Diferentes respostas da API
   - Diferentes parâmetros de rota

3. **Verificação de comportamento**:
   - Chamadas de função com parâmetros corretos
   - Atualizações de estado
   - Renderização condicional