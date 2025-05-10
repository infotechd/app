import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User, { TipoUsuarioEnum } from '../../models/User';
import Contratacao, { ContratacaoStatusEnum } from '../../models/Contratacao';
import authRoutes from '../../routes/authRoutes';
import cookieParser from 'cookie-parser';

// Create a real Express app for testing
const app = express();

// Configure middleware
app.use(express.json());
app.use(cookieParser());

// Apply routes
app.use('/api/auth', authRoutes);

describe('Auth Controller - Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let userId: string;
  let adminId: string;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Create a new MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri);

    // Set JWT secret for auth middleware
    process.env.JWT_SECRET = 'test-secret-for-integration';
  });

  afterAll(async () => {
    // Disconnect from the database
    await mongoose.disconnect();
    
    // Stop the MongoDB memory server
    await mongoServer.stop();
    
    // Clean up environment variables
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Contratacao.deleteMany({});

    // Create test admin user
    const admin = await User.create({
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      senha: 'Senha123',
      cpfCnpj: '12345678901',
      tipoUsuario: TipoUsuarioEnum.ADMIN
    });
    adminId = admin._id.toString();

    // Create admin token
    adminToken = jwt.sign(
      { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        nome: 'Usuário Teste',
        email: 'usuario@teste.com',
        senha: 'Senha123',
        telefone: '11987654321',
        cpfCnpj: '12345678902',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR,
        endereco: 'Rua Teste, 123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Usuário cadastrado com sucesso');

      // Verify in database
      const user = await User.findOne({ email: userData.email });
      expect(user).not.toBeNull();
      expect(user?.nome).toBe(userData.nome);
      expect(user?.email).toBe(userData.email);
      expect(user?.tipoUsuario).toBe(userData.tipoUsuario);
    });

    it('should return 409 if email already exists', async () => {
      // Arrange
      const existingUser = {
        nome: 'Usuário Existente',
        email: 'existente@teste.com',
        senha: 'Senha123',
        telefone: '11987654321',
        cpfCnpj: '12345678903',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR,
        endereco: 'Rua Teste, 123'
      };

      // Create user first
      await User.create(existingUser);

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Email já cadastrado');
    });

    it('should return 409 if cpfCnpj already exists', async () => {
      // Arrange
      await User.create({
        nome: 'Usuário Existente',
        email: 'existente@teste.com',
        senha: 'Senha123',
        telefone: '11987654321',
        cpfCnpj: '12345678904',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR,
        endereco: 'Rua Teste, 123'
      });

      const newUser = {
        nome: 'Novo Usuário',
        email: 'novo@teste.com',
        senha: 'Senha123',
        telefone: '11987654321',
        cpfCnpj: '12345678904', // Same CPF/CNPJ
        tipoUsuario: TipoUsuarioEnum.COMPRADOR,
        endereco: 'Rua Teste, 123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.message).toContain('CPF/CNPJ já cadastrado');
    });

    it('should return 400 if validation fails', async () => {
      // Arrange
      const invalidUser = {
        nome: 'Us', // Too short
        email: 'invalid-email',
        senha: '123', // Too short
        tipoUsuario: 'invalid-type'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        nome: 'Usuário Teste',
        email: 'usuario@teste.com',
        senha: 'Senha123', // Will be hashed by pre-save hook
        cpfCnpj: '12345678905',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      });
      userId = user._id.toString();
    });

    it('should login successfully with valid credentials', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'usuario@teste.com',
          senha: 'Senha123'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Login realizado com sucesso');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(userId);
      expect(response.body.user.email).toBe('usuario@teste.com');
      expect(response.body.user.tipoUsuario).toBe(TipoUsuarioEnum.COMPRADOR);
      
      // Check for cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=');
    });

    it('should return 401 with invalid email', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@teste.com',
          senha: 'Senha123'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Credenciais inválidas');
    });

    it('should return 401 with invalid password', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'usuario@teste.com',
          senha: 'SenhaErrada'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Credenciais inválidas');
    });

    it('should return 400 if validation fails', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          senha: ''
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        nome: 'Usuário Teste',
        email: 'usuario@teste.com',
        senha: 'Senha123',
        cpfCnpj: '12345678906',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      });
      userId = user._id.toString();

      // Create user token
      userToken = jwt.sign(
        { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );
    });

    it('should logout successfully', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Logout realizado com sucesso');
      
      // Check that cookie is cleared
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=;');
    });

    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/logout');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        nome: 'Usuário Teste',
        email: 'usuario@teste.com',
        senha: 'Senha123',
        telefone: '11987654321',
        cpfCnpj: '12345678907',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR,
        endereco: 'Rua Teste, 123'
      });
      userId = user._id.toString();

      // Create user token
      userToken = jwt.sign(
        { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );
    });

    it('should return user profile when authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body._id).toBe(userId);
      expect(response.body.nome).toBe('Usuário Teste');
      expect(response.body.email).toBe('usuario@teste.com');
      expect(response.body.tipoUsuario).toBe(TipoUsuarioEnum.COMPRADOR);
      expect(response.body.senha).toBeUndefined(); // Password should not be returned
    });

    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/profile');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        nome: 'Usuário Teste',
        email: 'usuario@teste.com',
        senha: 'Senha123',
        telefone: '11987654321',
        cpfCnpj: '12345678908',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR,
        endereco: 'Rua Teste, 123'
      });
      userId = user._id.toString();

      // Create user token
      userToken = jwt.sign(
        { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );
    });

    it('should update user profile successfully', async () => {
      // Arrange
      const updateData = {
        nome: 'Nome Atualizado',
        telefone: '11999999999',
        endereco: 'Rua Atualizada, 456'
      };

      // Act
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Perfil atualizado com sucesso');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.nome).toBe(updateData.nome);
      expect(response.body.user.telefone).toBe(updateData.telefone);
      expect(response.body.user.endereco).toBe(updateData.endereco);

      // Verify in database
      const updatedUser = await User.findById(userId);
      expect(updatedUser?.nome).toBe(updateData.nome);
      expect(updatedUser?.telefone).toBe(updateData.telefone);
      expect(updatedUser?.endereco).toBe(updateData.endereco);
    });

    it('should update password successfully', async () => {
      // Arrange
      const updateData = {
        senha: 'NovaSenha123'
      };

      // Act
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Perfil atualizado com sucesso');

      // Verify password was updated by trying to login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'usuario@teste.com',
          senha: 'NovaSenha123'
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should return 400 if no valid fields provided', async () => {
      // Act
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ invalidField: 'value' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Nenhum campo válido para atualização fornecido');
    });

    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ nome: 'Nome Atualizado' });

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 400 if validation fails', async () => {
      // Act
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nome: 'A', // Too short
          email: 'invalid-email'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/auth/profile', () => {
    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        nome: 'Usuário Teste',
        email: 'usuario@teste.com',
        senha: 'Senha123',
        cpfCnpj: '12345678909',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      });
      userId = user._id.toString();

      // Create user token
      userToken = jwt.sign(
        { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );
    });

    it('should delete user account successfully', async () => {
      // Act
      const response = await request(app)
        .delete('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Conta excluída com sucesso');

      // Verify in database
      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });

    it('should return 400 if user has active contracts', async () => {
      // Create an active contract
      await Contratacao.create({
        buyerId: userId,
        prestadorId: adminId,
        ofertaId: new mongoose.Types.ObjectId().toString(),
        valorTotal: 100,
        status: ContratacaoStatusEnum.PENDENTE
      });

      // Act
      const response = await request(app)
        .delete('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Não é possível excluir sua conta enquanto você possui contratações ativas');

      // Verify user still exists
      const user = await User.findById(userId);
      expect(user).not.toBeNull();
    });

    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app)
        .delete('/api/auth/profile');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/users', () => {
    beforeEach(async () => {
      // Create multiple test users
      await User.create([
        {
          nome: 'Usuário 1',
          email: 'usuario1@teste.com',
          senha: 'Senha123',
          cpfCnpj: '12345678910',
          tipoUsuario: TipoUsuarioEnum.COMPRADOR
        },
        {
          nome: 'Usuário 2',
          email: 'usuario2@teste.com',
          senha: 'Senha123',
          cpfCnpj: '12345678911',
          tipoUsuario: TipoUsuarioEnum.PRESTADOR
        },
        {
          nome: 'Usuário 3',
          email: 'usuario3@teste.com',
          senha: 'Senha123',
          cpfCnpj: '12345678912',
          tipoUsuario: TipoUsuarioEnum.ANUNCIANTE
        }
      ]);

      // Create regular user token
      const regularUser = await User.create({
        nome: 'Usuário Regular',
        email: 'regular@teste.com',
        senha: 'Senha123',
        cpfCnpj: '12345678913',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      });
      userId = regularUser._id.toString();

      userToken = jwt.sign(
        { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );
    });

    it('should list all users when user is admin', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(response.body.users.length).toBeGreaterThanOrEqual(5); // 4 created + admin
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalUsers).toBeGreaterThanOrEqual(5);
    });

    it('should paginate results correctly', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(response.body.users.length).toBe(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.itemsPerPage).toBe(2);
      expect(response.body.pagination.hasNextPage).toBe(true);
    });

    it('should return 403 if user is not admin', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${userToken}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Acesso proibido');
    });

    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/users');

      // Assert
      expect(response.status).toBe(401);
    });
  });
});