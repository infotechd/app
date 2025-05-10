# Testes para BuyerDashboardScreen

Este diretório contém testes para o componente BuyerDashboardScreen, que é responsável por exibir o dashboard do comprador, mostrando ofertas disponíveis e contratos contratados.

## Estrutura dos Testes

O arquivo `BuyerDashboardScreen.test.tsx` contém os seguintes testes:

1. **Renderização correta com dados**
   - Verifica se o componente renderiza corretamente quando os dados são carregados
   - Verifica se a mensagem de boas-vindas é exibida com o nome do usuário
   - Verifica se os títulos das seções são exibidos
   - Verifica se as ofertas são renderizadas corretamente
   - Verifica se os contratos são renderizados corretamente
   - Verifica se os botões de ação são exibidos

2. **Estado de carregamento**
   - Verifica se o indicador de carregamento é exibido quando os dados estão sendo carregados

3. **Estado de erro**
   - Verifica se a mensagem de erro é exibida quando ocorre um erro ao carregar os dados
   - Verifica se o botão "Tentar novamente" é exibido

4. **Navegação para detalhes da oferta**
   - Verifica se a navegação para a tela de detalhes da oferta ocorre quando uma oferta é pressionada

5. **Navegação para detalhes do contrato**
   - Verifica se a navegação para a tela de detalhes do contrato ocorre quando um contrato é pressionado

6. **Navegação para a tela de busca de ofertas**
   - Verifica se a navegação para a tela de busca de ofertas ocorre quando o botão de ação é pressionado

7. **Atualização de dados com pull-to-refresh**
   - Verifica se os dados são atualizados quando o usuário puxa para atualizar a tela

8. **Tratamento de nova tentativa após erro**
   - Verifica se os dados são carregados novamente quando o usuário pressiona o botão "Tentar novamente" após um erro

9. **Tratamento de caso quando o usuário não tem token**
   - Verifica se a mensagem de erro apropriada é exibida quando o usuário não tem token

## Mocks

Os seguintes mocks são utilizados nos testes:

- **API**: `fetchPublicOffers` e `fetchMyHiredContratacoes` são mockados para retornar dados de teste
- **AuthContext**: `useAuth` é mockado para retornar um usuário de teste
- **Navigation**: `navigation.navigate` é mockado para verificar se a navegação ocorre corretamente

## Configuração do Jest

Para executar esses testes, é necessário configurar o Jest corretamente para trabalhar com React Native e TypeScript. A configuração inclui:

1. **jest.config.js**:
   - Preset: 'jest-expo'
   - TestEnvironment: 'jsdom'
   - Transform: configurado para transformar arquivos TypeScript
   - TransformIgnorePatterns: configurado para permitir a transformação de módulos React Native

2. **jest.setup.js**:
   - Mock para componentes e APIs do React Native
   - Mock para AsyncStorage
   - Mock para navegação

## Execução dos Testes

Para executar os testes, use o seguinte comando:

```bash
pnpm test
```

Ou para executar apenas os testes do BuyerDashboardScreen:

```bash
pnpm jest BuyerDashboardScreen.test.tsx
```

## Problemas Conhecidos

Atualmente, há um problema com a configuração do Jest para trabalhar com React Native em um monorepo. O erro está relacionado aos polyfills do React Native, especificamente o arquivo `error-guard.js` que usa sintaxe TypeScript que o Jest não está configurado para lidar.

Para resolver esse problema, seria necessário uma configuração mais avançada do Jest, possivelmente envolvendo:

1. Configuração personalizada do Babel para transformar os módulos do React Native
2. Configuração de moduleNameMapper para substituir módulos problemáticos
3. Configuração de setupFiles para configurar o ambiente de teste antes da execução dos testes

Recomenda-se consultar a documentação oficial do Jest e do React Native para obter mais informações sobre como configurar o Jest para trabalhar com React Native em um monorepo.