import { jest } from '@jest/globals';
import Stripe from 'stripe';
import * as stripeIntegration from '../stripeIntegration';

// Mock the Stripe library
jest.mock('stripe');

// Mock environment variables
const originalEnv = process.env;

describe('Stripe Integration', () => {
  // Setup before tests
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    
    // Mock environment variables
    process.env = { 
      ...originalEnv,
      STRIPE_SECRET_KEY: 'sk_test_mockkey',
      STRIPE_WEBHOOK_SECRET: 'whsec_mockwebhooksecret',
      STRIPE_RETURN_URL: 'https://example.com/return'
    };
    
    // Clear module cache to ensure environment variables are reloaded
    jest.resetModules();
  });

  // Restore original environment after tests
  afterAll(() => {
    process.env = originalEnv;
  });

  describe('processPayment', () => {
    it('should successfully process a payment', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_mock123456',
        status: 'succeeded',
        amount: 1000,
        currency: 'brl',
        client_secret: 'secret_mock',
        payment_method: 'pm_mock123456'
      };

      // Mock Stripe's paymentIntents.create method
      const mockCreate = jest.fn().mockResolvedValue(mockPaymentIntent);
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.paymentIntents = {
        create: mockCreate
      } as any;

      const paymentParams = {
        amount: 1000,
        paymentMethodId: 'pm_mock123456',
        customerId: 'cus_mock123456',
        description: 'Test payment',
        metadata: { contratacaoId: '12345' }
      };

      // Act
      const result = await stripeIntegration.processPayment(paymentParams);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPaymentIntent);
      expect(mockCreate).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'brl',
        payment_method: 'pm_mock123456',
        customer: 'cus_mock123456',
        confirm: true,
        confirmation_method: 'automatic',
        return_url: 'https://example.com/return',
        description: 'Test payment',
        metadata: { contratacaoId: '12345' }
      }, undefined);
    });

    it('should handle payment with idempotency key', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_mock123456',
        status: 'succeeded',
        amount: 1000,
        currency: 'brl'
      };

      // Mock Stripe's paymentIntents.create method
      const mockCreate = jest.fn().mockResolvedValue(mockPaymentIntent);
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.paymentIntents = {
        create: mockCreate
      } as any;

      const paymentParams = {
        amount: 1000,
        paymentMethodId: 'pm_mock123456',
        idempotencyKey: 'idem_key_12345'
      };

      // Act
      const result = await stripeIntegration.processPayment(paymentParams);

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.anything(),
        { idempotencyKey: 'idem_key_12345' }
      );
    });

    it('should validate required parameters', async () => {
      // Arrange
      const invalidParams = {
        // Missing amount
        paymentMethodId: 'pm_mock123456'
      };

      // Act
      const result = await stripeIntegration.processPayment(invalidParams as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Parâmetros inválidos');
    });

    it('should validate amount is positive', async () => {
      // Arrange
      const invalidParams = {
        amount: 0, // Invalid amount (zero)
        paymentMethodId: 'pm_mock123456'
      };

      // Act
      const result = await stripeIntegration.processPayment(invalidParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Parâmetros inválidos');
    });

    it('should validate paymentMethodId is provided', async () => {
      // Arrange
      const invalidParams = {
        amount: 1000,
        // Missing paymentMethodId
      };

      // Act
      const result = await stripeIntegration.processPayment(invalidParams as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Parâmetros inválidos');
    });

    it('should handle Stripe API errors', async () => {
      // Arrange
      const stripeError = {
        type: 'card_error',
        message: 'Your card was declined',
        code: 'card_declined',
        decline_code: 'insufficient_funds'
      };

      // Mock Stripe's paymentIntents.create method to throw an error
      const mockCreate = jest.fn().mockRejectedValue(stripeError);
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.paymentIntents = {
        create: mockCreate
      } as any;

      const paymentParams = {
        amount: 1000,
        paymentMethodId: 'pm_mock123456'
      };

      // Act
      const result = await stripeIntegration.processPayment(paymentParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Your card was declined');
      expect(result.code).toBe('card_declined');
      expect(result.decline_code).toBe('insufficient_funds');
    });

    it('should handle non-Stripe errors', async () => {
      // Arrange
      const networkError = new Error('Network error');

      // Mock Stripe's paymentIntents.create method to throw a generic error
      const mockCreate = jest.fn().mockRejectedValue(networkError);
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.paymentIntents = {
        create: mockCreate
      } as any;

      const paymentParams = {
        amount: 1000,
        paymentMethodId: 'pm_mock123456'
      };

      // Act
      const result = await stripeIntegration.processPayment(paymentParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro inesperado');
      expect(result.details).toBe('Network error');
    });

    it('should handle missing Stripe secret key', async () => {
      // Arrange
      process.env.STRIPE_SECRET_KEY = '';
      
      const paymentParams = {
        amount: 1000,
        paymentMethodId: 'pm_mock123456'
      };

      // Act
      const result = await stripeIntegration.processPayment(paymentParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro interno de configuração');
    });
  });

  describe('processRefund', () => {
    it('should successfully process a refund', async () => {
      // Arrange
      const mockRefund = {
        id: 're_mock123456',
        status: 'succeeded',
        amount: 1000,
        payment_intent: 'pi_mock123456'
      };

      // Mock Stripe's refunds.create method
      const mockCreate = jest.fn().mockResolvedValue(mockRefund);
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.refunds = {
        create: mockCreate
      } as any;

      // Act
      const result = await stripeIntegration.processRefund('pi_mock123456', 1000, 'requested_by_customer');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRefund);
      expect(mockCreate).toHaveBeenCalledWith({
        payment_intent: 'pi_mock123456',
        amount: 1000,
        reason: 'requested_by_customer'
      }, undefined);
    });

    it('should process a full refund when amount is not provided', async () => {
      // Arrange
      const mockRefund = {
        id: 're_mock123456',
        status: 'succeeded',
        payment_intent: 'pi_mock123456'
      };

      // Mock Stripe's refunds.create method
      const mockCreate = jest.fn().mockResolvedValue(mockRefund);
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.refunds = {
        create: mockCreate
      } as any;

      // Act
      const result = await stripeIntegration.processRefund('pi_mock123456');

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        payment_intent: 'pi_mock123456',
        amount: undefined,
        reason: undefined
      }, undefined);
    });

    it('should handle refund with idempotency key', async () => {
      // Arrange
      const mockRefund = {
        id: 're_mock123456',
        status: 'succeeded'
      };

      // Mock Stripe's refunds.create method
      const mockCreate = jest.fn().mockResolvedValue(mockRefund);
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.refunds = {
        create: mockCreate
      } as any;

      // Act
      const result = await stripeIntegration.processRefund('pi_mock123456', 1000, undefined, 'idem_key_12345');

      // Assert
      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.anything(),
        { idempotencyKey: 'idem_key_12345' }
      );
    });

    it('should validate paymentIntentId is provided', async () => {
      // Act
      const result = await stripeIntegration.processRefund('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID do PaymentIntent é obrigatório');
    });

    it('should validate amount is positive if provided', async () => {
      // Act
      const result = await stripeIntegration.processRefund('pi_mock123456', -100);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Valor do estorno inválido');
    });

    it('should handle Stripe API errors during refund', async () => {
      // Arrange
      const stripeError = {
        type: 'invalid_request_error',
        message: 'Refund cannot be processed',
        code: 'charge_already_refunded'
      };

      // Mock Stripe's refunds.create method to throw an error
      const mockCreate = jest.fn().mockRejectedValue(stripeError);
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.refunds = {
        create: mockCreate
      } as any;

      // Act
      const result = await stripeIntegration.processRefund('pi_mock123456');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund cannot be processed');
      expect(result.code).toBe('charge_already_refunded');
    });

    it('should handle non-Stripe errors during refund', async () => {
      // Arrange
      const networkError = new Error('Network error');

      // Mock Stripe's refunds.create method to throw a generic error
      const mockCreate = jest.fn().mockRejectedValue(networkError);
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.refunds = {
        create: mockCreate
      } as any;

      // Act
      const result = await stripeIntegration.processRefund('pi_mock123456');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro inesperado');
      expect(result.details).toBe('Network error');
    });

    it('should handle missing Stripe secret key during refund', async () => {
      // Arrange
      process.env.STRIPE_SECRET_KEY = '';
      
      // Act
      const result = await stripeIntegration.processRefund('pi_mock123456');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro interno de configuração');
    });
  });

  describe('constructWebhookEvent', () => {
    it('should successfully construct a webhook event', () => {
      // Arrange
      const mockEvent = {
        id: 'evt_mock123456',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_mock123456' } }
      };

      // Mock Stripe's webhooks.constructEvent method
      const mockConstructEvent = jest.fn().mockReturnValue(mockEvent);
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.webhooks = {
        constructEvent: mockConstructEvent
      } as any;

      const requestBody = JSON.stringify({ id: 'pi_mock123456' });
      const signature = 'mock_signature';

      // Act
      const result = stripeIntegration.constructWebhookEvent(requestBody, signature);

      // Assert
      expect(result).toEqual(mockEvent);
      expect(mockConstructEvent).toHaveBeenCalledWith(requestBody, signature, 'whsec_mockwebhooksecret');
    });

    it('should throw error when webhook secret is missing', () => {
      // Arrange
      process.env.STRIPE_WEBHOOK_SECRET = '';
      
      const requestBody = JSON.stringify({ id: 'pi_mock123456' });
      const signature = 'mock_signature';

      // Act & Assert
      expect(() => {
        stripeIntegration.constructWebhookEvent(requestBody, signature);
      }).toThrow('Webhook secret não configurado');
    });

    it('should throw error when signature is missing', () => {
      // Arrange
      const requestBody = JSON.stringify({ id: 'pi_mock123456' });
      const signature = undefined;

      // Act & Assert
      expect(() => {
        stripeIntegration.constructWebhookEvent(requestBody, signature);
      }).toThrow('Assinatura do webhook ausente');
    });

    it('should throw error when signature verification fails', () => {
      // Arrange
      const signatureError = new Error('Invalid signature');
      
      // Mock Stripe's webhooks.constructEvent method to throw an error
      const mockConstructEvent = jest.fn().mockImplementation(() => {
        throw signatureError;
      });
      
      (Stripe as jest.MockedClass<typeof Stripe>).prototype.webhooks = {
        constructEvent: mockConstructEvent
      } as any;

      const requestBody = JSON.stringify({ id: 'pi_mock123456' });
      const signature = 'invalid_signature';

      // Act & Assert
      expect(() => {
        stripeIntegration.constructWebhookEvent(requestBody, signature);
      }).toThrow(signatureError);
    });
  });
});