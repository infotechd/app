import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { TipoUsuarioEnum } from '../../models/User';
import authMiddleware from '../authMiddleware';

// Create a real Express app for testing
const app = express();

// Configure middleware
app.use(express.json());
app.use(cookieParser());

// Create a protected route for testing
app.get('/api/protected', authMiddleware, (req, res) => {
  res.status(200).json({ 
    message: 'Protected route accessed successfully',
    user: req.user 
  });
});

// Create an unprotected route for testing
app.get('/api/public', (req, res) => {
  res.status(200).json({ message: 'Public route accessed successfully' });
});

describe('Auth Middleware - E2E Tests', () => {
  let authToken: string;

  beforeAll(() => {
    // Setup environment variables
    process.env.JWT_SECRET = 'test-secret-for-e2e';

    // Create a valid token for testing
    const payload = {
      userId: new mongoose.Types.ObjectId().toString(),
      tipoUsuario: TipoUsuarioEnum.COMPRADOR
    };

    authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(() => {
    // No server to close, but we can clean up environment variables
    delete process.env.JWT_SECRET;
  });

  describe('Protected Routes', () => {
    it('should allow access to protected route with valid token in Authorization header', async () => {
      // Act
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Protected route accessed successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.userId).toBeDefined();
      expect(response.body.user.tipoUsuario).toBe(TipoUsuarioEnum.COMPRADOR);
    });

    it('should allow access to protected route with valid token in cookie', async () => {
      // Act
      const response = await request(app)
        .get('/api/protected')
        .set('Cookie', [`token=${authToken}`]);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Protected route accessed successfully');
      expect(response.body.user).toBeDefined();
    });

    it('should deny access to protected route without token', async () => {
      // Act
      const response = await request(app)
        .get('/api/protected');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Acesso não autorizado: Token não fornecido.');
    });

    it('should deny access to protected route with invalid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Acesso não autorizado: Token inválido ou expirado.');
    });

    it('should deny access to protected route with malformed token', async () => {
      // Create a token with missing required fields
      const invalidToken = jwt.sign({ 
        // Missing userId
        someOtherField: 'value' 
      }, process.env.JWT_SECRET as string);

      // Act
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${invalidToken}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Acesso não autorizado: Token com estrutura inválida.');
    });
  });

  describe('Public Routes', () => {
    it('should allow access to public route without token', async () => {
      // Act
      const response = await request(app)
        .get('/api/public');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Public route accessed successfully');
    });

    it('should allow access to public route with valid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/public')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Public route accessed successfully');
    });
  });
});
