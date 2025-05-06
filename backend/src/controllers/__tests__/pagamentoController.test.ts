import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { 
  processarPagamento, 
  estornarPagamento, 
  listarMeusPagamentos, 
  obterDetalhesPagamento, 
  handleWebhookFintech 
} from '../pagamentoController';
import Pagamento, { PagamentoStatusEnum, PagamentoMetodoEnum } from '../../models/Pagamento';
import Contratacao, { ContratacaoStatusEnum } from '../../models/Contratacao';
import { TipoUsuarioEnum } from '../../models/User';

// Mock dos modelos Mongoose
jest.mock('../../models/Pagamento');
jest.mock('../../models/Contratacao');

describe('PagamentoController', () => {
  // Configuração comum para os testes
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Reset dos mocks
    jest.clearAllMocks();

    // Mock do objeto de resposta
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Mock da função next
    next = jest.fn();

    // Mock do mongoose.Types.ObjectId.isValid
    (mongoose.Types.ObjectId.isValid as jest.Mock) = jest.fn().mockImplementation(
      (id) => typeof id === 'string' && id.length === 24
    );
  });

  describe('processarPagamento', () => {
    beforeEach(() => {
      // Configuração específica para processarPagamento
      req = {
        user: { userId: 'buyerId123', tipoUsuario: TipoUsuarioEnum.COMPRADOR },
        body: {
          contratacaoId: 'validContratacaoId123',
          metodo: PagamentoMetodoEnum.CARTAO_CREDITO
        }
      };
    });

    it('deve retornar 401 se o usuário não estiver autenticado', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await processarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 400 se o ID da contratação for inválido', async () => {
      // Arrange
      req.body.contratacaoId = 'invalidId';
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      // Act
      await processarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da contratação inválido ou ausente.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 400 se o método de pagamento for inválido', async () => {
      // Arrange
      req.body.metodo = 'metodo_invalido';

      // Act
      await processarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: `Método de pagamento inválido: metodo_invalido.` });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 404 se a contratação não for encontrada', async () => {
      // Arrange
      (Contratacao.findById as jest.Mock).mockResolvedValueOnce(null);

      // Act
      await processarPagamento(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith('validContratacaoId123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contratação não encontrada.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 403 se o usuário não for o comprador da contratação', async () => {
      // Arrange
      const mockContratacao = {
        _id: 'validContratacaoId123',
        buyerId: { toString: () => 'differentBuyerId' },
        status: ContratacaoStatusEnum.PENDENTE,
        valorTotal: 100
      };
      (Contratacao.findById as jest.Mock).mockResolvedValueOnce(mockContratacao);

      // Act
      await processarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Você não é o comprador desta contratação.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 400 se o status da contratação não permitir pagamento', async () => {
      // Arrange
      const mockContratacao = {
        _id: 'validContratacaoId123',
        buyerId: { toString: () => 'buyerId123' },
        status: ContratacaoStatusEnum.CANCELADO_BUYER,
        valorTotal: 100
      };
      (Contratacao.findById as jest.Mock).mockResolvedValueOnce(mockContratacao);

      // Act
      await processarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: `Não é possível pagar uma contratação com status '${ContratacaoStatusEnum.CANCELADO_BUYER}'.` 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve processar o pagamento com sucesso e retornar 200', async () => {
      // Arrange
      const mockContratacao = {
        _id: 'validContratacaoId123',
        buyerId: { toString: () => 'buyerId123' },
        status: ContratacaoStatusEnum.ACEITA,
        valorTotal: 100
      };

      const mockPagamento = {
        _id: 'pagamentoId123',
        contratacaoId: 'validContratacaoId123',
        valor: 100,
        metodo: PagamentoMetodoEnum.CARTAO_CREDITO,
        historicoStatus: [],
        save: jest.fn().mockResolvedValue(true),
        statusAtual: PagamentoStatusEnum.APROVADO
      };

      (Contratacao.findById as jest.Mock).mockResolvedValueOnce(mockContratacao);
      (Pagamento as unknown as jest.Mock).mockImplementationOnce(() => mockPagamento);

      // Act
      await processarPagamento(req as Request, res as Response, next);

      // Assert
      expect(Pagamento).toHaveBeenCalledWith({
        contratacaoId: mockContratacao._id,
        valor: mockContratacao.valorTotal,
        metodo: PagamentoMetodoEnum.CARTAO_CREDITO,
        historicoStatus: [{ 
          status: PagamentoStatusEnum.CRIADO, 
          timestamp: expect.any(Date) 
        }]
      });

      expect(mockPagamento.save).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Processamento de pagamento concluído.', 
        pagamento: mockPagamento 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve adicionar status de erro ao pagamento e chamar next quando ocorrer uma exceção', async () => {
      // Arrange
      const mockContratacao = {
        _id: 'validContratacaoId123',
        buyerId: { toString: () => 'buyerId123' },
        status: ContratacaoStatusEnum.ACEITA,
        valorTotal: 100
      };

      const mockPagamento = {
        _id: 'pagamentoId123',
        contratacaoId: 'validContratacaoId123',
        valor: 100,
        metodo: PagamentoMetodoEnum.CARTAO_CREDITO,
        historicoStatus: [],
        save: jest.fn().mockResolvedValue(true),
        statusAtual: PagamentoStatusEnum.CRIADO
      };

      const error = new Error('Erro de teste');

      (Contratacao.findById as jest.Mock).mockResolvedValueOnce(mockContratacao);
      (Pagamento as unknown as jest.Mock).mockImplementationOnce(() => mockPagamento);
      mockPagamento.save.mockImplementationOnce(() => { throw error; });

      // Act
      await processarPagamento(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('estornarPagamento', () => {
    beforeEach(() => {
      // Configuração específica para estornarPagamento
      req = {
        user: { userId: 'buyerId123', tipoUsuario: TipoUsuarioEnum.COMPRADOR },
        params: { pagamentoId: 'validPagamentoId123' }
      };
    });

    it('deve retornar 401 se o usuário não estiver autenticado', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await estornarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 400 se o ID do pagamento for inválido', async () => {
      // Arrange
      req.params = { pagamentoId: 'invalidId' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      // Act
      await estornarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do pagamento inválido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 404 se o pagamento não for encontrado', async () => {
      // Arrange
      (Pagamento.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(null)
      });

      // Act
      await estornarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Pagamento não encontrado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 403 se o usuário não tiver permissão para estornar', async () => {
      // Arrange
      const mockContratacao = {
        buyerId: { toString: () => 'differentBuyerId' },
        status: ContratacaoStatusEnum.ACEITA
      };

      const mockPagamento = {
        _id: 'validPagamentoId123',
        contratacaoId: mockContratacao,
        statusAtual: PagamentoStatusEnum.APROVADO,
        transacaoId: 'transacaoId123',
        historicoStatus: []
      };

      (Pagamento.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockPagamento)
      });

      // Act
      await estornarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Acesso proibido: Você não tem permissão para estornar este pagamento.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 400 se o status do pagamento não permitir estorno', async () => {
      // Arrange
      const mockContratacao = {
        buyerId: { toString: () => 'buyerId123' },
        status: ContratacaoStatusEnum.CANCELADO_BUYER
      };

      const mockPagamento = {
        _id: 'validPagamentoId123',
        contratacaoId: mockContratacao,
        statusAtual: PagamentoStatusEnum.RECUSADO,
        transacaoId: 'transacaoId123',
        historicoStatus: []
      };

      (Pagamento.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockPagamento)
      });

      // Act
      await estornarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: `Não é possível estornar um pagamento com status '${PagamentoStatusEnum.RECUSADO}'.` 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 400 se o pagamento não tiver ID de transação', async () => {
      // Arrange
      const mockContratacao = {
        buyerId: { toString: () => 'buyerId123' },
        status: ContratacaoStatusEnum.CANCELADO_BUYER
      };

      const mockPagamento = {
        _id: 'validPagamentoId123',
        contratacaoId: mockContratacao,
        statusAtual: PagamentoStatusEnum.APROVADO,
        transacaoId: undefined,
        historicoStatus: []
      };

      (Pagamento.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockPagamento)
      });

      // Act
      await estornarPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Não é possível estornar: ID da transação externa não encontrado.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve processar o estorno com sucesso e retornar 200', async () => {
      // Arrange
      const mockContratacao = {
        buyerId: { toString: () => 'buyerId123' },
        status: ContratacaoStatusEnum.CANCELADO_BUYER
      };

      const mockPagamento = {
        _id: 'validPagamentoId123',
        contratacaoId: mockContratacao,
        statusAtual: PagamentoStatusEnum.APROVADO,
        transacaoId: 'transacaoId123',
        historicoStatus: [],
        save: jest.fn().mockResolvedValue({ 
          _id: 'validPagamentoId123',
          statusAtual: PagamentoStatusEnum.REEMBOLSADO
        })
      };

      (Pagamento.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockPagamento)
      });

      // Act
      await estornarPagamento(req as Request, res as Response, next);

      // Assert
      expect(mockPagamento.historicoStatus.push).toHaveBeenCalledWith({
        status: PagamentoStatusEnum.REEMBOLSADO,
        timestamp: expect.any(Date),
        motivo: expect.any(String)
      });

      expect(mockPagamento.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: expect.stringContaining('Estorno processado pela Fintech'), 
        pagamento: expect.any(Object)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next quando ocorrer uma exceção', async () => {
      // Arrange
      const error = new Error('Erro de teste');
      (Pagamento.findById as jest.Mock).mockImplementationOnce(() => {
        throw error;
      });

      // Act
      await estornarPagamento(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('listarMeusPagamentos', () => {
    it('deve retornar 501 pois o endpoint não está implementado', async () => {
      // Act
      await listarMeusPagamentos(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({ message: 'Endpoint não implementado.' });
    });
  });

  describe('obterDetalhesPagamento', () => {
    it('deve retornar 501 pois o endpoint não está implementado', async () => {
      // Act
      await obterDetalhesPagamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({ message: 'Endpoint não implementado.' });
    });
  });

  describe('handleWebhookFintech', () => {
    it('deve retornar 200 ao receber um webhook', async () => {
      // Arrange
      req = {
        body: { event: 'payment_confirmed', transactionId: 'transacaoId123' }
      };

      // Act
      await handleWebhookFintech(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('Webhook recebido.');
    });
  });
});
