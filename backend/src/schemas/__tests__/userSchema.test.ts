import { describe, it, expect } from '@jest/globals';
import { 
  createUserSchema, 
  updateUserSchema, 
  loginUserSchema 
} from '../userSchema';
import { TipoUsuarioEnum } from '../../models/User';

describe('User Schemas', () => {
  // Valid test data
  const validUserData = {
    nome: 'John Doe',
    email: 'john.doe@example.com',
    telefone: '11987654321',
    cpfCnpj: '12345678901', // CPF format
    tipoUsuario: TipoUsuarioEnum.COMPRADOR,
    endereco: 'Rua Exemplo, 123',
    foto: 'https://example.com/photo.jpg'
  };

  const validCreateUserData = {
    ...validUserData,
    senha: 'Test123'
  };

  const validLoginData = {
    email: 'john.doe@example.com',
    senha: 'Test123'
  };

  describe('createUserSchema', () => {
    it('should validate a valid user creation data', () => {
      const result = createUserSchema.safeParse(validCreateUserData);
      expect(result.success).toBe(true);
    });

    it('should require nome with at least 3 characters', () => {
      const result = createUserSchema.safeParse({
        ...validCreateUserData,
        nome: 'Jo'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('pelo menos 3 caracteres');
      }
    });

    it('should validate email format', () => {
      const result = createUserSchema.safeParse({
        ...validCreateUserData,
        email: 'invalid-email'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email inválido');
      }
    });

    it('should validate telefone format when provided', () => {
      const result = createUserSchema.safeParse({
        ...validCreateUserData,
        telefone: '123456'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('telefone válido');
      }
    });

    it('should validate cpfCnpj length', () => {
      // Test invalid CPF (less than 11 digits)
      const resultShortCpf = createUserSchema.safeParse({
        ...validCreateUserData,
        cpfCnpj: '1234567890'
      });
      expect(resultShortCpf.success).toBe(false);

      // Test valid CNPJ (14 digits)
      const resultValidCnpj = createUserSchema.safeParse({
        ...validCreateUserData,
        cpfCnpj: '12345678901234'
      });
      expect(resultValidCnpj.success).toBe(true);
    });

    it('should validate tipoUsuario enum values', () => {
      const result = createUserSchema.safeParse({
        ...validCreateUserData,
        tipoUsuario: 'invalid-type'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Tipo de usuário inválido');
      }
    });

    it('should validate senha requirements', () => {
      // Test password too short
      const resultShortPassword = createUserSchema.safeParse({
        ...validCreateUserData,
        senha: 'Test1'
      });
      expect(resultShortPassword.success).toBe(false);

      // Test password without uppercase
      const resultNoUppercase = createUserSchema.safeParse({
        ...validCreateUserData,
        senha: 'test123'
      });
      expect(resultNoUppercase.success).toBe(false);

      // Test password without lowercase
      const resultNoLowercase = createUserSchema.safeParse({
        ...validCreateUserData,
        senha: 'TEST123'
      });
      expect(resultNoLowercase.success).toBe(false);

      // Test password without number
      const resultNoNumber = createUserSchema.safeParse({
        ...validCreateUserData,
        senha: 'TestTest'
      });
      expect(resultNoNumber.success).toBe(false);
    });
  });

  describe('updateUserSchema', () => {
    it('should validate a complete valid update', () => {
      const result = updateUserSchema.safeParse(validCreateUserData);
      expect(result.success).toBe(true);
    });

    it('should validate a partial update with only some fields', () => {
      const result = updateUserSchema.safeParse({
        nome: 'Jane Doe',
        email: 'jane.doe@example.com'
      });
      expect(result.success).toBe(true);
    });

    it('should validate senha requirements when provided', () => {
      const result = updateUserSchema.safeParse({
        nome: 'Jane Doe',
        senha: 'weak'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Senha deve');
      }
    });
  });

  describe('loginUserSchema', () => {
    it('should validate valid login data', () => {
      const result = loginUserSchema.safeParse(validLoginData);
      expect(result.success).toBe(true);
    });

    it('should require email', () => {
      const result = loginUserSchema.safeParse({
        senha: 'Test123'
      });
      expect(result.success).toBe(false);
    });

    it('should require senha', () => {
      const result = loginUserSchema.safeParse({
        email: 'john.doe@example.com'
      });
      expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
      const result = loginUserSchema.safeParse({
        email: 'invalid-email',
        senha: 'Test123'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email inválido');
      }
    });
  });
});
