import { z } from 'zod';

/**
 * Validates data against a Zod schema and returns the validated data
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns The validated data
 * @throws Error if validation fails
 */
export function validateWithZod<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format the error message
      const errorMessage = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      throw new Error(`Validation error: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Validates data against a Zod schema and returns the validated data or null if validation fails
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns The validated data or null if validation fails
 */
export function validateWithZodSafe<T>(schema: z.ZodType<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
}

/**
 * Validates data against a Zod schema and returns a result object
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns An object with success, data, and error properties
 */
export function validateWithZodResult<T>(schema: z.ZodType<T>, data: unknown): { 
  success: boolean; 
  data: T | null; 
  error: string | null;
} {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
      error: null
    };
  } catch (error) {
    let errorMessage = 'Unknown validation error';
    
    if (error instanceof z.ZodError) {
      errorMessage = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      data: null,
      error: errorMessage
    };
  }
}