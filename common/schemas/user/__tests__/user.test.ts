import { userSchema, createUserSchema, updateUserSchema, loginUserSchema } from '../index';

describe('User Schemas', () => {
  describe('userSchema', () => {
    it('should validate a valid user', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject an invalid user', () => {
      const invalidUser = {
        id: 'not-a-uuid',
        name: 'J', // too short
        email: 'not-an-email',
        password: 'short', // too short
        createdAt: 'not-a-date',
        updatedAt: 'not-a-date',
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('createUserSchema', () => {
    it('should validate a valid user creation payload', () => {
      const validCreateUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const result = createUserSchema.safeParse(validCreateUser);
      expect(result.success).toBe(true);
    });

    it('should reject an invalid user creation payload', () => {
      const invalidCreateUser = {
        name: 'J', // too short
        email: 'not-an-email',
        password: 'short', // too short
      };

      const result = createUserSchema.safeParse(invalidCreateUser);
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserSchema', () => {
    it('should validate a valid user update payload', () => {
      const validUpdateUser = {
        name: 'John Updated',
      };

      const result = updateUserSchema.safeParse(validUpdateUser);
      expect(result.success).toBe(true);
    });
  });

  describe('loginUserSchema', () => {
    it('should validate a valid login payload', () => {
      const validLogin = {
        email: 'john@example.com',
        password: 'password123',
      };

      const result = loginUserSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject an invalid login payload', () => {
      const invalidLogin = {
        email: 'not-an-email',
        password: 'short', // too short
      };

      const result = loginUserSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });
});