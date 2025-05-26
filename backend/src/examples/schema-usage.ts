import { 
  userSchema, 
  createUserSchema, 
  loginUserSchema,
  offerSchema,
  createOfferSchema,
  apiResponseSchema,
  paginationParamsSchema
} from 'app-common';

/**
 * Exemplo de validação de dados de usuário com esquemas Zod
 */
function validateUserExample() {
  // Dados de exemplo do usuário do corpo da requisição
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  };

  // Validação usando o esquema Zod
  const result = createUserSchema.safeParse(userData);

  if (result.success) {
    console.log('Dados do usuário são válidos:', result.data);
    // Prosseguir com a criação do usuário no banco de dados
    return { success: true, data: result.data };
  } else {
    console.error('Erros de validação:', result.error.issues);
    // Retornar erros de validação para o cliente
    return { 
      success: false, 
      error: 'Falha na validação', 
      issues: result.error.issues 
    };
  }
}

/**
 * Exemplo de validação de dados de login com esquemas Zod
 */
function validateLoginExample() {
  // Dados de exemplo de login do corpo da requisição
  const loginData = {
    email: 'john@example.com',
    password: 'short' // Muito curto, vai falhar na validação
  };

  // Validação usando o esquema Zod
  const result = loginUserSchema.safeParse(loginData);

  if (result.success) {
    console.log('Dados de login são válidos:', result.data);
    // Prosseguir com a autenticação
    return { success: true, data: result.data };
  } else {
    console.error('Erros de validação:', result.error.issues);
    // Retornar erros de validação para o cliente
    return { 
      success: false, 
      error: 'Credenciais inválidas', 
      issues: result.error.issues 
    };
  }
}

/**
 * Exemplo de validação de parâmetros de paginação
 */
function validatePaginationExample(queryParams: any) {
  // Parâmetros de consulta de exemplo
  const params = {
    page: queryParams.page ? Number(queryParams.page) : undefined,
    limit: queryParams.limit ? Number(queryParams.limit) : undefined
  };

  // Validar e obter valores padrão para valores ausentes
  const result = paginationParamsSchema.safeParse(params);

  if (result.success) {
    // Usará valores padrão se não fornecidos (page=1, limit=10)
    return result.data;
  } else {
    // Usar valores padrão se a validação falhar
    return { page: 1, limit: 10 };
  }
}

/**
 * Exemplo de criação de uma resposta de API tipada
 */
function createApiResponse<T>(data: T, success = true, message?: string): any {
  const response = {
    success,
    data,
    message
  };

  // Validar o formato da resposta
  const result = apiResponseSchema.safeParse(response);

  if (result.success) {
    return response;
  } else {
    // Isso nunca deve acontecer se construirmos a resposta corretamente
    console.error('Formato de resposta de API inválido:', result.error.issues);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

export {
  validateUserExample,
  validateLoginExample,
  validatePaginationExample,
  createApiResponse
};
