import { z } from 'zod';

/**
 * Valida os dados contra um esquema Zod e retorna os dados validados
 * @param schema O esquema Zod para validação
 * @param data Os dados a serem validados
 * @returns Os dados validados
 * @throws Error se a validação falhar
 */
export function validateWithZod<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Formata a mensagem de erro
      const formattedErrors = error.errors.map(err => {
        return `${err.path.join('.')}: ${err.message}`;
      }).join(', ');

      console.error('Erro de validação:', formattedErrors);
      throw new Error(`Erro de validação: ${formattedErrors}`);
    }
    throw error;
  }
}

/**
 * Valida os dados contra um esquema Zod e retorna os dados validados ou null se a validação falhar
 * @param schema O esquema Zod para validação
 * @param data Os dados a serem validados
 * @returns Os dados validados ou null se a validação falhar
 */
export function validateWithZodSafe<T>(schema: z.ZodType<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Formata a mensagem de erro
      const formattedErrors = error.errors.map(err => {
        return `${err.path.join('.')}: ${err.message}`;
      }).join(', ');

      console.error('Erro de validação:', formattedErrors);
    } else {
      console.error('Erro de validação desconhecido:', error);
    }
    return null;
  }
}

/**
 * Valida os dados contra um esquema Zod e retorna um objeto de resultado
 * @param schema O esquema Zod para validação
 * @param data Os dados a serem validados
 * @returns Um objeto com propriedades de sucesso, dados e erro
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
    if (error instanceof z.ZodError) {
      // Formata a mensagem de erro
      const formattedErrors = error.errors.map(err => {
        return `${err.path.join('.')}: ${err.message}`;
      }).join(', ');

      return {
        success: false,
        data: null,
        error: formattedErrors
      };
    }

    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
