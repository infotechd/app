# Validação de Dados com Zod

Este diretório contém esquemas de validação usando a biblioteca [Zod](https://github.com/colinhacks/zod) para garantir a integridade dos dados em toda a aplicação.

## O que é Zod?

Zod é uma biblioteca de declaração e validação de esquemas TypeScript-first. Alguns benefícios do Zod incluem:

- **Validação em tempo de execução**: Garante que os dados correspondam às suas definições de tipo
- **Inferência de tipo**: Permite que o TypeScript infira tipos a partir dos esquemas Zod
- **Mensagens de erro personalizáveis**: Fornece feedback claro sobre problemas de validação
- **Composição**: Permite construir esquemas complexos a partir de blocos mais simples

## Estrutura dos Esquemas

Os esquemas estão organizados em arquivos separados por domínio:

- `user.schema.ts`: Esquemas para dados de usuário (login, registro, perfil)
- `api.schema.ts`: Esquemas para respostas da API
- `offer.schema.ts`: Esquemas para ofertas de serviço
- `contratacao.schema.ts`: Esquemas para contratos de serviço

## Como Usar

### Validação Básica

```typescript
import { userSchema } from '../schemas/user.schema';
import { validateWithZod } from '../utils/validation';

// Validar dados de usuário
try {
  const validatedUser = validateWithZod(userSchema, userData);
  // Continuar com os dados validados
} catch (error) {
  // Tratar erro de validação
  console.error('Erro de validação:', error.message);
}
```

### Validação Segura (sem exceções)

```typescript
import { offerSchema } from '../schemas/offer.schema';
import { validateWithZodSafe } from '../utils/validation';

// Validar dados de oferta sem lançar exceções
const validatedOffer = validateWithZodSafe(offerSchema, offerData);
if (validatedOffer) {
  // Continuar com os dados validados
} else {
  // Lidar com dados inválidos
}
```

### Validação com Resultado Detalhado

```typescript
import { contratacaoSchema } from '../schemas/contratacao.schema';
import { validateWithZodResult } from '../utils/validation';

// Obter resultado detalhado da validação
const result = validateWithZodResult(contratacaoSchema, contratacaoData);
if (result.success) {
  // Usar result.data (dados validados)
} else {
  // Usar result.error (mensagem de erro)
}
```

## Integração com API

Os esquemas Zod são usados para validar tanto as entradas quanto as saídas das chamadas de API:

1. **Validação de Entrada**: Garante que os dados enviados para a API estejam corretos
2. **Validação de Saída**: Verifica se as respostas da API correspondem ao formato esperado

Exemplo de uso em uma função de API:

```typescript
export const login = async (email: string, senha: string): Promise<LoginResponse> => {
  try {
    // Validar credenciais de login com Zod
    const credentials = validateWithZod(loginCredentialsSchema, { email, senha });

    // Fazer chamada de API
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: credentials
    });

    // Validar resposta com Zod
    const data = validateWithZod(loginResponseSchema, response);
    return data;
  } catch (error) {
    // Tratar erro
    throw error;
  }
};
```

## Testes

Os esquemas Zod são testados em `src/services/__tests__/api.zod.test.ts` para garantir que a validação funcione corretamente para diferentes cenários:

- Dados válidos passam na validação
- Dados inválidos falham na validação com mensagens de erro apropriadas
- Respostas da API são validadas corretamente

## Benefícios da Validação com Zod

- **Segurança**: Detecta problemas de dados antes que causem erros em tempo de execução
- **Documentação**: Os esquemas servem como documentação viva da estrutura de dados
- **Manutenção**: Facilita a identificação de mudanças na estrutura de dados
- **Experiência do usuário**: Permite fornecer feedback mais preciso sobre erros de entrada