# Documentação da API

## Visão Geral

Este documento fornece informações sobre como acessar e utilizar a documentação da API para os serviços de backend do Super App.

## Acessando a Documentação da API

A documentação da API está disponível através do Swagger UI, que fornece uma interface interativa para explorar e testar os endpoints da API.

### URL

Quando o servidor estiver em execução, você pode acessar a documentação da API em:

```
http://localhost:3000/api-docs
```

> Nota: A porta pode variar se a porta padrão (3000) já estiver em uso.

### Funcionalidades

O Swagger UI oferece as seguintes funcionalidades:

1. **Documentação Interativa**: Navegue por todos os endpoints da API disponíveis, organizados por tags.
2. **Construtor de Requisições**: Construa e teste requisições da API diretamente do navegador.
3. **Visualizador de Respostas**: Visualize as respostas da API em um formato estruturado.
4. **Autenticação**: Teste endpoints autenticados fornecendo um token JWT.
5. **Modelos**: Visualize os modelos de dados utilizados pela API.

## Autenticação

Muitos endpoints da API requerem autenticação. Para autenticar:

1. Primeiro, use o endpoint `/api/auth/login` para obter um token JWT.
2. Clique no botão "Authorize" na interface do Swagger UI.
3. Insira seu token JWT no formato: `Bearer seu-token-aqui`.
4. Clique em "Authorize" para aplicar o token a todas as requisições autenticadas.

## Endpoints da API

A API está organizada nas seguintes categorias:

- **Ofertas**: Endpoints para gerenciamento de ofertas de serviço.
- **Contratações**: Endpoints para gerenciamento de contratos de serviço.
- **Comentários**: Endpoints para gerenciamento de comentários.
- **Curtidas**: Endpoints para gerenciamento de curtidas.
- **Bloqueios de Agenda**: Endpoints para gerenciamento de bloqueios na agenda.
- **Currículos**: Endpoints para gerenciamento de currículos.
- **Negociações**: Endpoints para gerenciamento de negociações.
- **Publicações na Comunidade**: Endpoints para gerenciamento de publicações na comunidade.
- **Notificações**: Endpoints para gerenciamento de notificações.
- **Relatórios**: Endpoints para geração de relatórios.
- **Treinamentos**: Endpoints para gerenciamento de treinamentos.
- **Agenda**: Endpoints para gerenciamento de agendas.
- **Upload**: Endpoints para upload de arquivos.
- **Sistema**: Endpoints relacionados ao sistema, como verificação de saúde.

## Especificação OpenAPI Bruta

Se você precisar da especificação OpenAPI em formato JSON, ela está disponível em:

```
http://localhost:3000/api-docs.json
```

Isso pode ser útil para gerar código cliente ou importar para outras ferramentas de API.

## Adicionando Documentação a Novos Endpoints

Ao adicionar novos endpoints à API, siga estas diretrizes para garantir que sejam devidamente documentados:

1. Use comentários JSDoc com anotações Swagger acima de cada definição de rota.
2. Defina parâmetros de requisição, esquema de corpo e esquema de resposta.
3. Inclua exemplos para requisição e resposta.
4. Especifique requisitos de segurança para endpoints autenticados.
5. Agrupe endpoints relacionados usando tags.

Exemplo:

```javascript
/**
 * @swagger
 * /resource:
 *   get:
 *     summary: Breve descrição
 *     description: Descrição detalhada
 *     tags: [Categoria]
 *     parameters:
 *       - name: param
 *         in: query
 *         description: Descrição do parâmetro
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resposta de sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 property:
 *                   type: string
 */
```

## Recursos Adicionais

- [Especificação OpenAPI](https://swagger.io/specification/)
- [Documentação do Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc/blob/master/docs/GETTING-STARTED.md)
- [Documentação do Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)
