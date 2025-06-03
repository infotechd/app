# Testes para UnifiedDashboardScreen

Este diretório contém testes para o componente UnifiedDashboardScreen, que é responsável por exibir um dashboard unificado que permite ao usuário gerenciar seus diferentes papéis na plataforma (comprador, prestador, anunciante).

## Estrutura dos Testes

O arquivo `UnifiedDashboardScreen.test.tsx` contém os seguintes testes:

1. **Renderização correta com dados do usuário**
   - Verifica se o componente renderiza corretamente com os dados do usuário
   - Verifica se a mensagem de boas-vindas é exibida com o nome do usuário
   - Verifica se a seção de gerenciamento de papéis é exibida
   - Verifica se a contagem de papéis ativos é exibida corretamente

2. **Renderização condicional de seções de papel**
   - Verifica se a seção de comprador é renderizada quando o usuário é um comprador
   - Verifica se a seção de prestador é renderizada quando o usuário é um prestador
   - Verifica se a seção de anunciante não é renderizada quando o usuário não é um anunciante
   - Verifica se a seção de anunciante é renderizada quando o usuário é um anunciante

3. **Expansão de seções de papel**
   - Verifica se o conteúdo da seção de papel é exibido quando o cabeçalho é clicado

4. **Alternância de papéis do usuário**
   - Verifica se a função updateProfile é chamada com os parâmetros corretos quando um botão de alternância de papel é pressionado
   - Verifica se a função updateUser é chamada com os dados atualizados do usuário
   - Verifica se o alerta de sucesso é exibido

5. **Prevenção de desativação do último papel ativo**
   - Verifica se um alerta de erro é exibido quando o usuário tenta desativar seu único papel ativo
   - Verifica se a função updateProfile não é chamada nesse caso

6. **Navegação para outras telas**
   - Verifica se a navegação para a tela de criação de treinamento ocorre quando o botão correspondente é pressionado
   - Verifica se a navegação para a tela inicial ocorre quando o botão "Voltar para Início" é pressionado

7. **Definição de papel ativo inicial a partir dos parâmetros da rota**
   - Verifica se o papel ativo é definido corretamente a partir dos parâmetros da rota

## Mocks

Os seguintes mocks são utilizados nos testes:

- **API**: `updateProfile` é mockado para retornar dados de teste
- **AuthContext**: `useAuth` é mockado para retornar um usuário de teste e uma função de atualização
- **Alert**: `Alert.alert` é mockado para verificar se os alertas são exibidos corretamente
- **Navigation**: `navigation.navigate` é mockado para verificar se a navegação ocorre corretamente
- **@expo/vector-icons**: `MaterialIcons` é mockado para renderizar um componente simples que exibe o nome do ícone

## Problemas Conhecidos

Atualmente, há um problema com a configuração do Jest para trabalhar com o preset jest-expo. O erro está relacionado ao EventEmitter do Expo, que não está sendo mockado corretamente:

```
TypeError: Cannot destructure property 'EventEmitter' of 'globalThis.expo' as it is undefined.
```

Para resolver esse problema, seria necessário uma configuração mais avançada do Jest, possivelmente envolvendo:

1. Configuração personalizada para mockar o objeto globalThis.expo antes que o preset jest-expo tente acessá-lo
2. Criação de um preset personalizado que não dependa do EventEmitter do Expo
3. Atualização das versões do Jest e do jest-expo para versões compatíveis

## Execução dos Testes

Uma vez que os problemas de configuração do Jest sejam resolvidos, os testes podem ser executados com o seguinte comando:

```bash
pnpm test src/screens/__tests__/UnifiedDashboardScreen.test.tsx
```

## Próximos Passos

1. Resolver os problemas de configuração do Jest para permitir a execução dos testes
2. Adicionar testes para mais casos de borda, como usuários com diferentes combinações de papéis
3. Adicionar testes para verificar se as estatísticas são exibidas corretamente em cada seção de papel
4. Adicionar testes de integração para verificar a interação com o backend