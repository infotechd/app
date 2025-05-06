# Testes para ofertaController.ts

## Decisão: npm vs pnpm

Após análise da estrutura do projeto, decidi utilizar **pnpm** para executar os testes pelos seguintes motivos:

1. **Configuração do Monorepo**: O projeto está configurado como um monorepo usando pnpm workspaces, como evidenciado pelo arquivo `pnpm-workspace.yaml` na raiz do projeto.

2. **Package Manager Declarado**: O arquivo `package.json` na raiz do projeto especifica explicitamente `"packageManager": "pnpm@10.9.0+..."`, indicando que pnpm é o gerenciador de pacotes preferido.

3. **Eficiência em Monorepos**: O pnpm é mais eficiente para monorepos devido à sua estrutura de armazenamento de dependências compartilhadas e links simbólicos, economizando espaço em disco e melhorando o tempo de instalação.

4. **Consistência de Dependências**: O pnpm garante maior consistência nas dependências entre os diferentes pacotes do monorepo, evitando problemas de versões conflitantes.

5. **Arquivos de Lock**: O projeto já possui um arquivo `pnpm-lock.yaml`, que mantém as versões exatas das dependências, garantindo builds consistentes.

## Testes Implementados

Foram implementados testes para todas as funções do controlador de ofertas (`ofertaController.ts`):

### 1. createOferta
- Testa a criação bem-sucedida de uma oferta quando o usuário é um prestador
- Verifica se retorna 403 quando o usuário não é um prestador
- Verifica se retorna 403 quando o usuário não está autenticado
- Verifica se retorna 400 quando campos obrigatórios estão ausentes
- Verifica se retorna 400 quando o preço é negativo
- Testa o tratamento de erros de validação do Mongoose
- Testa o tratamento de exceções gerais

### 2. listOfertasByPrestador
- Testa a listagem de ofertas para um prestador autenticado
- Verifica a filtragem de ofertas por status
- Verifica se retorna 403 quando o usuário não é um prestador
- Testa o tratamento de exceções

### 3. getOwnOfertaDetails
- Testa a obtenção de detalhes de uma oferta específica do prestador
- Verifica se retorna 400 quando o ID da oferta é inválido
- Verifica se retorna 404 quando a oferta não é encontrada ou não pertence ao prestador
- Verifica se retorna 403 quando o usuário não é um prestador
- Testa o tratamento de exceções

### 4. updateOferta
- Testa a atualização bem-sucedida de uma oferta
- Verifica se retorna 400 quando nenhum campo válido é fornecido para atualização
- Verifica se retorna 400 quando o ID da oferta é inválido
- Verifica se retorna 404 quando a oferta não é encontrada ou não pertence ao prestador
- Verifica se retorna 403 quando o usuário não é um prestador
- Testa o tratamento de erros de validação do Mongoose
- Testa o tratamento de exceções gerais

### 5. deleteOferta
- Testa a exclusão bem-sucedida de uma oferta
- Verifica se retorna 400 quando o ID da oferta é inválido
- Verifica se retorna 404 quando a oferta não é encontrada ou não pertence ao prestador
- Verifica se retorna 403 quando o usuário não é um prestador
- Testa o tratamento de exceções

### 6. searchPublicOfertas
- Testa a listagem de ofertas públicas com paginação padrão
- Verifica a filtragem de ofertas por faixa de preço
- Verifica a filtragem de ofertas por pesquisa de texto
- Testa o tratamento de exceções

### 7. getPublicOfertaById
- Testa a obtenção de detalhes de uma oferta pública específica
- Verifica se retorna 400 quando o ID da oferta é inválido
- Verifica se retorna 404 quando a oferta não é encontrada ou não está disponível
- Testa o tratamento de exceções

## Resultados dos Testes

Os testes para `ofertaController.ts` foram executados com sucesso. Embora existam falhas em outros arquivos de teste do projeto, os testes que criamos para o controlador de ofertas estão funcionando corretamente.

## Conclusão

O uso do pnpm para testes em um ambiente de monorepo como este projeto é a escolha mais adequada devido à sua eficiência e consistência. Os testes implementados cobrem todos os aspectos do controlador de ofertas, incluindo casos de sucesso, validação de entrada, verificação de permissões e tratamento de erros.