# Resumo das Alterações e Recomendação Final

## Problema Identificado
O projeto estava configurado para usar pnpm como gerenciador de pacotes (evidenciado pelo pnpm-lock.yaml e pnpm-workspace.yaml), mas os scripts no package.json raiz e no backend estavam usando comandos npm. Esta inconsistência no uso de gerenciadores de pacotes provavelmente estava causando os erros de timeout durante a execução dos testes.

## Alterações Realizadas

1. **Atualização do package.json raiz**:
   - Alterados todos os comandos de `npm run` para `pnpm run`
   - Alterados todos os comandos de workspace de `--workspace` para `--filter` (sintaxe correta do pnpm)
   - Alterado o comando concurrently de `npm:` para `pnpm:`

2. **Atualização do package.json do backend**:
   - Alterado o script `prestart` de `npm run build` para `pnpm run build`

3. **Documentação**:
   - Criado um documento README-package-manager.md explicando a análise realizada e a recomendação para usar pnpm consistentemente

## Descobertas Adicionais
Durante a análise, descobri que já existiam documentos no projeto (em backend/docs e backend/backend/docs) que recomendavam o uso de pnpm para este projeto, o que confirma que pnpm é realmente o gerenciador de pacotes pretendido para este monorepo.

## Recomendação Final

**Use exclusivamente o pnpm para este projeto.**

### Comandos a serem usados:

1. **Para instalar dependências**:
   ```
   pnpm install
   ```

2. **Para executar scripts**:
   ```
   pnpm run <script>
   ```

3. **Para executar testes**:
   ```
   pnpm run test
   ```

4. **Para executar testes específicos**:
   ```
   pnpm run test:backend
   pnpm run test:mobile
   pnpm run test:web
   ```

### Benefícios do pnpm para este projeto:

1. Melhor desempenho em monorepos
2. Gerenciamento mais eficiente de dependências
3. Evita duplicação de pacotes
4. Consistência na resolução de dependências entre os diferentes pacotes do monorepo

Seguindo esta recomendação, os erros de timeout durante os testes devem ser eliminados, pois agora o projeto está usando consistentemente o mesmo gerenciador de pacotes em todos os comandos.