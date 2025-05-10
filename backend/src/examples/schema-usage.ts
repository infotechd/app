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
 * Example of validating user data with Zod schemas
 */
function validateUserExample() {
  // Example user data from request body
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  };

  // Validate using Zod schema
  const result = createUserSchema.safeParse(userData);

  if (result.success) {
    console.log('User data is valid:', result.data);
    // Proceed with creating user in database
    return { success: true, data: result.data };
  } else {
    console.error('Validation errors:', result.error.issues);
    // Return validation errors to client
    return { 
      success: false, 
      error: 'Validation failed', 
      issues: result.error.issues 
    };
  }
}

/**
 * Example of validating login data with Zod schemas
 */
function validateLoginExample() {
  // Example login data from request body
  const loginData = {
    email: 'john@example.com',
    password: 'short' // Too short, will fail validation
  };

  // Validate using Zod schema
  const result = loginUserSchema.safeParse(loginData);

  if (result.success) {
    console.log('Login data is valid:', result.data);
    // Proceed with authentication
    return { success: true, data: result.data };
  } else {
    console.error('Validation errors:', result.error.issues);
    // Return validation errors to client
    return { 
      success: false, 
      error: 'Invalid credentials', 
      issues: result.error.issues 
    };
  }
}

/**
 * Example of validating pagination parameters
 */
function validatePaginationExample(queryParams: any) {
  // Example query parameters
  const params = {
    page: queryParams.page ? Number(queryParams.page) : undefined,
    limit: queryParams.limit ? Number(queryParams.limit) : undefined
  };

  // Validate and get defaults for missing values
  const result = paginationParamsSchema.safeParse(params);

  if (result.success) {
    // Will use defaults if not provided (page=1, limit=10)
    return result.data;
  } else {
    // Use default values if validation fails
    return { page: 1, limit: 10 };
  }
}

/**
 * Example of creating a typed API response
 */
function createApiResponse<T>(data: T, success = true, message?: string): any {
  const response = {
    success,
    data,
    message
  };

  // Validate the response format
  const result = apiResponseSchema.safeParse(response);
  
  if (result.success) {
    return response;
  } else {
    // This should never happen if we construct the response correctly
    console.error('Invalid API response format:', result.error.issues);
    return { success: false, error: 'Internal server error' };
  }
}

export {
  validateUserExample,
  validateLoginExample,
  validatePaginationExample,
  createApiResponse
};