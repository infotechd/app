# Testes de Integração para UnifiedDashboardScreen

Este documento descreve os testes de integração implementados para o componente `UnifiedDashboardScreen.tsx`.

## Visão Geral

O arquivo `UnifiedDashboardScreen.integration.test.tsx` contém testes de integração para o componente `UnifiedDashboardScreen`. Estes testes verificam a integração do componente com o contexto de autenticação (AuthContext) e os serviços de API.

## Casos de Teste Implementados

Os seguintes casos de teste foram implementados:

1. **Renderização com dados do usuário do AuthContext**
   - Verifica se o componente renderiza corretamente com os dados do usuário fornecidos pelo AuthContext
   - Verifica se a mensagem de boas-vindas e a contagem de papéis ativos são exibidas corretamente

2. **Renderização de seções de papel com base nos papéis do usuário**
   - Verifica se as seções de comprador e prestador são renderizadas quando o usuário tem esses papéis
   - Verifica se a seção de anunciante não é renderizada quando o usuário não tem esse papel
   - Verifica se todas as seções são renderizadas quando o usuário tem todos os papéis

3. **Expansão de seção de papel ao clicar no cabeçalho**
   - Verifica se o conteúdo da seção de papel é exibido quando o cabeçalho é clicado

4. **Alternância de papel do usuário ao pressionar o botão de alternância**
   - Verifica se a função updateProfile é chamada com os parâmetros corretos
   - Verifica se o alerta de sucesso é exibido

5. **Prevenção de desativação do último papel ativo**
   - Verifica se o alerta de erro é exibido quando o usuário tenta desativar seu único papel ativo
   - Verifica se updateProfile não é chamado

6. **Navegação para a tela correta ao pressionar o botão de ação**
   - Verifica se a função navigate é chamada com os parâmetros corretos

7. **Navegação para a tela inicial ao pressionar o botão de início**
   - Verifica se a função navigate é chamada com 'Home'

8. **Definição do papel ativo inicial a partir dos parâmetros da rota**
   - Verifica se o papel especificado nos parâmetros da rota é expandido por padrão

9. **Tratamento de erro de API ao alternar papel do usuário**
   - Verifica se o alerta de erro é exibido quando a API retorna um erro

10. **Tratamento de dados de usuário ausentes**
    - Verifica se um nome de usuário padrão é exibido quando os dados do usuário não estão disponíveis

11. **Integração com várias seções de papel**
    - Verifica se todas as seções de papel podem ser expandidas e se seu conteúdo é exibido corretamente

## Como Executar os Testes

Para executar os testes de integração, use o seguinte comando:

```bash
pnpm test:custom src/screens/__tests__/UnifiedDashboardScreen.integration.test.tsx
```

Este comando usa a configuração personalizada do Jest definida em `jest.custom.config.js`.

## Notas sobre a Implementação

Os testes de integração foram implementados seguindo o padrão usado em outros testes de integração do projeto. Eles usam:

1. **Mocks para dependências externas**:
   - API functions (updateProfile)
   - Alert.alert

2. **Mock do hook useAuth**:
   - Fornece dados de usuário simulados
   - Simula funções como updateUser, login, logout

3. **Componente wrapper para testes**:
   - UnifiedDashboardWithAuth configura o mock do useAuth e renderiza o componente UnifiedDashboardScreen

## Problemas Conhecidos

Atualmente, os testes estão falhando devido a problemas de configuração com o ambiente de teste. Isso pode estar relacionado a:

1. Incompatibilidades com a versão do React Native ou do Jest
2. Problemas com os mocks de componentes UI como MaterialIcons
3. Configuração específica necessária para o componente UnifiedDashboardScreen

Recomenda-se revisar a configuração do Jest e os mocks para resolver esses problemas.