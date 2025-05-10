import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Contratacao, { ContratacaoStatusEnum } from '../../models/Contratacao';
import OfertaServico, { OfertaStatusEnum } from '../../models/OfertaServico';
import User, { TipoUsuarioEnum } from '../../models/User';
import contratacaoRoutes from '../../routes/contratacaoRoutes';
import authMiddleware from '../../middlewares/authMiddleware';

// Create a real Express app for testing
const app = express();

// Configure middleware
app.use(express.json());

// Apply routes
app.use('/api/contratacoes', contratacaoRoutes);

describe('Contratacao Controller - Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let buyerId: string;
  let prestadorId: string;
  let ofertaId: string;
  let contratacaoId: string;
  let buyerToken: string;
  let prestadorToken: string;

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
    await Contratacao.deleteMany({});
    await OfertaServico.deleteMany({});
    await User.deleteMany({});

    // Create test users
    const buyer = await User.create({
      nome: 'Comprador Teste',
      email: 'comprador@teste.com',
      senha: 'senha123',
      tipoUsuario: TipoUsuarioEnum.COMPRADOR
    });
    buyerId = buyer._id.toString();

    const prestador = await User.create({
      nome: 'Prestador Teste',
      email: 'prestador@teste.com',
      senha: 'senha123',
      tipoUsuario: TipoUsuarioEnum.PRESTADOR
    });
    prestadorId = prestador._id.toString();

    // Create test oferta
    const oferta = await OfertaServico.create({
      titulo: 'Oferta de Teste',
      descricao: 'Descrição da oferta de teste',
      preco: 100,
      prestadorId: prestador._id,
      status: OfertaStatusEnum.DISPONIVEL
    });
    ofertaId = oferta._id.toString();

    // Create tokens
    buyerToken = jwt.sign(
      { userId: buyerId, tipoUsuario: TipoUsuarioEnum.COMPRADOR },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    prestadorToken = jwt.sign(
      { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/contratacoes', () => {
    it('should create a new contract when user is a buyer', async () => {
      // Act
      const response = await request(app)
        .post('/api/contratacoes')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ ofertaId });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Oferta contratada com sucesso');
      expect(response.body.contratacao).toBeDefined();
      expect(response.body.contratacao.buyerId).toBe(buyerId);
      expect(response.body.contratacao.prestadorId).toBe(prestadorId);
      expect(response.body.contratacao.ofertaId).toBe(ofertaId);
      expect(response.body.contratacao.status).toBe(ContratacaoStatusEnum.PENDENTE);

      // Verify in database
      const contratacao = await Contratacao.findById(response.body.contratacao._id);
      expect(contratacao).not.toBeNull();
      expect(contratacao?.buyerId.toString()).toBe(buyerId);
      expect(contratacao?.status).toBe(ContratacaoStatusEnum.PENDENTE);

      // Save for later tests
      contratacaoId = response.body.contratacao._id;
    });

    it('should return 403 if user is not a buyer', async () => {
      // Act
      const response = await request(app)
        .post('/api/contratacoes')
        .set('Authorization', `Bearer ${prestadorToken}`)
        .send({ ofertaId });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Apenas compradores podem contratar ofertas');
    });

    it('should return 400 if ofertaId is invalid', async () => {
      // Act
      const response = await request(app)
        .post('/api/contratacoes')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ ofertaId: 'invalid-id' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 if buyer tries to contract their own offer', async () => {
      // Create an offer by the buyer
      const buyerOferta = await OfertaServico.create({
        titulo: 'Oferta do Comprador',
        descricao: 'Descrição da oferta do comprador',
        preco: 150,
        prestadorId: buyerId,
        status: OfertaStatusEnum.DISPONIVEL
      });

      // Act
      const response = await request(app)
        .post('/api/contratacoes')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ ofertaId: buyerOferta._id.toString() });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Você não pode contratar sua própria oferta');
    });

    it('should return 400 if buyer already has a pending contract for the offer', async () => {
      // Create a contract first
      await request(app)
        .post('/api/contratacoes')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ ofertaId });

      // Try to create another contract for the same offer
      const response = await request(app)
        .post('/api/contratacoes')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ ofertaId });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Você já possui uma contratação pendente ou em andamento');
    });
  });

  describe('GET /api/contratacoes', () => {
    beforeEach(async () => {
      // Create a contract for testing
      const contratacao = await Contratacao.create({
        buyerId,
        prestadorId,
        ofertaId,
        valorTotal: 100,
        status: ContratacaoStatusEnum.PENDENTE
      });
      contratacaoId = contratacao._id.toString();
    });

    it('should list contracts where user is buyer', async () => {
      // Act
      const response = await request(app)
        .get('/api/contratacoes')
        .set('Authorization', `Bearer ${buyerToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.contratacoes).toBeDefined();
      expect(response.body.contratacoes.length).toBeGreaterThan(0);
      expect(response.body.contratacoes[0].buyerId).toBeDefined();
      expect(response.body.contratacoes[0].prestadorId).toBeDefined();
    });

    it('should list contracts where user is provider', async () => {
      // Act
      const response = await request(app)
        .get('/api/contratacoes')
        .set('Authorization', `Bearer ${prestadorToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.contratacoes).toBeDefined();
      expect(response.body.contratacoes.length).toBeGreaterThan(0);
    });

    it('should filter contracts by status', async () => {
      // Create a contract with different status
      await Contratacao.create({
        buyerId,
        prestadorId,
        ofertaId,
        valorTotal: 150,
        status: ContratacaoStatusEnum.ACEITA
      });

      // Act
      const response = await request(app)
        .get(`/api/contratacoes?status=${ContratacaoStatusEnum.PENDENTE}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.contratacoes).toBeDefined();
      expect(response.body.contratacoes.length).toBe(1);
      expect(response.body.contratacoes[0].status).toBe(ContratacaoStatusEnum.PENDENTE);
    });

    it('should return 401 if user is not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/contratacoes');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/contratacoes/:contratacaoId', () => {
    beforeEach(async () => {
      // Create a contract for testing
      const contratacao = await Contratacao.create({
        buyerId,
        prestadorId,
        ofertaId,
        valorTotal: 100,
        status: ContratacaoStatusEnum.PENDENTE
      });
      contratacaoId = contratacao._id.toString();
    });

    it('should return contract details when user is buyer', async () => {
      // Act
      const response = await request(app)
        .get(`/api/contratacoes/${contratacaoId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body._id).toBe(contratacaoId);
      expect(response.body.buyerId).toBeDefined();
      expect(response.body.prestadorId).toBeDefined();
      expect(response.body.ofertaId).toBeDefined();
    });

    it('should return contract details when user is provider', async () => {
      // Act
      const response = await request(app)
        .get(`/api/contratacoes/${contratacaoId}`)
        .set('Authorization', `Bearer ${prestadorToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body._id).toBe(contratacaoId);
    });

    it('should return 403 if user is not a participant in the contract', async () => {
      // Create another user
      const otherUser = await User.create({
        nome: 'Outro Usuário',
        email: 'outro@teste.com',
        senha: 'senha123',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      });

      const otherUserToken = jwt.sign(
        { userId: otherUser._id.toString(), tipoUsuario: TipoUsuarioEnum.COMPRADOR },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      // Act
      const response = await request(app)
        .get(`/api/contratacoes/${contratacaoId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Acesso proibido');
    });

    it('should return 404 if contract not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      // Act
      const response = await request(app)
        .get(`/api/contratacoes/${nonExistentId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('não encontrada');
    });
  });

  describe('PATCH /api/contratacoes/:contratacaoId/status', () => {
    beforeEach(async () => {
      // Create a contract for testing
      const contratacao = await Contratacao.create({
        buyerId,
        prestadorId,
        ofertaId,
        valorTotal: 100,
        status: ContratacaoStatusEnum.PENDENTE
      });
      contratacaoId = contratacao._id.toString();
    });

    it('should update contract status from PENDENTE to ACEITA when user is provider', async () => {
      // Act
      const response = await request(app)
        .patch(`/api/contratacoes/${contratacaoId}/status`)
        .set('Authorization', `Bearer ${prestadorToken}`)
        .send({ status: ContratacaoStatusEnum.ACEITA });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.contratacao.status).toBe(ContratacaoStatusEnum.ACEITA);

      // Verify in database
      const contratacao = await Contratacao.findById(contratacaoId);
      expect(contratacao?.status).toBe(ContratacaoStatusEnum.ACEITA);
    });

    it('should update contract status from ACEITA to EM_ANDAMENTO when user is provider', async () => {
      // First update to ACEITA
      await Contratacao.findByIdAndUpdate(contratacaoId, { 
        status: ContratacaoStatusEnum.ACEITA 
      });

      // Act
      const response = await request(app)
        .patch(`/api/contratacoes/${contratacaoId}/status`)
        .set('Authorization', `Bearer ${prestadorToken}`)
        .send({ status: ContratacaoStatusEnum.EM_ANDAMENTO });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.contratacao.status).toBe(ContratacaoStatusEnum.EM_ANDAMENTO);

      // Verify in database
      const contratacao = await Contratacao.findById(contratacaoId);
      expect(contratacao?.status).toBe(ContratacaoStatusEnum.EM_ANDAMENTO);
      expect(contratacao?.dataInicioServico).toBeDefined();
    });

    it('should update contract status from EM_ANDAMENTO to CONCLUIDO when user is provider', async () => {
      // Update to EM_ANDAMENTO
      await Contratacao.findByIdAndUpdate(contratacaoId, { 
        status: ContratacaoStatusEnum.EM_ANDAMENTO,
        dataInicioServico: new Date()
      });

      // Act
      const response = await request(app)
        .patch(`/api/contratacoes/${contratacaoId}/status`)
        .set('Authorization', `Bearer ${prestadorToken}`)
        .send({ status: ContratacaoStatusEnum.CONCLUIDO });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.contratacao.status).toBe(ContratacaoStatusEnum.CONCLUIDO);

      // Verify in database
      const contratacao = await Contratacao.findById(contratacaoId);
      expect(contratacao?.status).toBe(ContratacaoStatusEnum.CONCLUIDO);
      expect(contratacao?.dataFimServico).toBeDefined();
    });

    it('should update contract status to CANCELADO_BUYER when user is buyer', async () => {
      // Act
      const response = await request(app)
        .patch(`/api/contratacoes/${contratacaoId}/status`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ status: ContratacaoStatusEnum.CANCELADO_BUYER });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.contratacao.status).toBe(ContratacaoStatusEnum.CANCELADO_BUYER);

      // Verify in database
      const contratacao = await Contratacao.findById(contratacaoId);
      expect(contratacao?.status).toBe(ContratacaoStatusEnum.CANCELADO_BUYER);
    });

    it('should return 403 if user does not have permission to change status', async () => {
      // Act - buyer trying to accept
      const response = await request(app)
        .patch(`/api/contratacoes/${contratacaoId}/status`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ status: ContratacaoStatusEnum.ACEITA });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Ação não permitida');
    });

    it('should return 400 if status is invalid', async () => {
      // Act
      const response = await request(app)
        .patch(`/api/contratacoes/${contratacaoId}/status`)
        .set('Authorization', `Bearer ${prestadorToken}`)
        .send({ status: 'INVALID_STATUS' });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
});