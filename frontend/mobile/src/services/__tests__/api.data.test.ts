import {
  fetchTrainings,
  fetchTrainingDetail,
  createTraining,
  fetchAuthenticatedOffers,
  fetchPublicOffers,
  fetchMyOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  hireOffer,
  processPayment,
  submitReview,
  saveCurriculo,
  fetchAgenda,
  updateCompromissoStatus,
  fetchReceivedContratacoes,
  fetchMyHiredContratacoes,
  fetchMyAds,
  fetchMyTrainings,
  fetchPublicacoes,
  createPublicacao,
  fetchNotificacoes,
  markNotificacaoAsRead,
  deleteNotificacao,
  iniciarNegociacao,
  responderNegociacao,
  confirmarNegociacao,
  fetchNegociacaoByContratacaoId,
  fetchRelatorio
} from '../api';
import axios from 'axios';
import { API_URL } from '../../config/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock fetch
global.fetch = jest.fn();
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Data Manipulation API Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock the connectivity check (axios.head call to Google)
    mockedAxios.head.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {}
    });
  });

  // Tests for Training functions
  describe('Training Functions', () => {
    // Tests for fetchTrainings
    describe('fetchTrainings', () => {
      const mockTrainings = [
        { id: '1', title: 'Training 1', description: 'Description 1' },
        { id: '2', title: 'Training 2', description: 'Description 2' }
      ];
      const mockResponse = { trainings: mockTrainings };

      test('should return trainings when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchTrainings();

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/trainings`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Failed to fetch trainings';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchTrainings()).rejects.toThrow(errorMessage);
      });
    });

    // Tests for fetchTrainingDetail
    describe('fetchTrainingDetail', () => {
      const trainingId = '1';
      const mockTraining = { id: trainingId, title: 'Training 1', description: 'Description 1' };
      const mockResponse = { training: mockTraining };

      test('should return training details when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchTrainingDetail(trainingId);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/trainings/${trainingId}`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Training not found';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchTrainingDetail(trainingId)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for createTraining
    describe('createTraining', () => {
      const validToken = 'valid-jwt-token';
      const trainingData = {
        title: 'New Training',
        description: 'Training Description',
        price: 100,
        duration: 60
      };
      const mockResponse = { message: 'Training created successfully', trainingId: '3' };

      test('should return success message when training creation is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await createTraining(validToken, trainingData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/trainings`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(trainingData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when training creation fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Invalid training data';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(createTraining(validToken, trainingData)).rejects.toThrow(errorMessage);
      });
    });
  });

  // Tests for Offer functions
  describe('Offer Functions', () => {
    // Tests for fetchAuthenticatedOffers
    describe('fetchAuthenticatedOffers', () => {
      const validToken = 'valid-jwt-token';
      const params = { category: 'IT', page: 1, limit: 10 };
      const mockOffers = [
        { id: '1', title: 'Offer 1', description: 'Description 1' },
        { id: '2', title: 'Offer 2', description: 'Description 2' }
      ];
      const mockResponse = { offers: mockOffers, total: 2 };

      test('should return offers when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchAuthenticatedOffers(validToken, params);

        // Verify fetch was called with correct URL including query parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          expect.stringContaining(`${API_URL}/offers?category=IT&page=1&limit=10`),
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Failed to fetch offers';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchAuthenticatedOffers(validToken, params)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for fetchPublicOffers
    describe('fetchPublicOffers', () => {
      const params = { category: 'IT', page: 1, limit: 10 };
      const mockOffers = [
        { id: '1', title: 'Offer 1', description: 'Description 1' },
        { id: '2', title: 'Offer 2', description: 'Description 2' }
      ];
      const mockResponse = { offers: mockOffers, total: 2 };

      test('should return public offers when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchPublicOffers(params);

        // Verify fetch was called with correct URL including query parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          expect.stringContaining(`${API_URL}/public/offers?category=IT&page=1&limit=10`),
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Failed to fetch public offers';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchPublicOffers(params)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for fetchMyOffers
    describe('fetchMyOffers', () => {
      const validToken = 'valid-jwt-token';
      const params = { status: 'active', page: 1, limit: 10 };
      const mockOffers = [
        { id: '1', title: 'My Offer 1', description: 'Description 1' },
        { id: '2', title: 'My Offer 2', description: 'Description 2' }
      ];
      const mockResponse = { offers: mockOffers, total: 2 };

      test('should return user offers when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchMyOffers(validToken, params);

        // Verify fetch was called with correct URL including query parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          expect.stringContaining(`${API_URL}/offers/my?status=active&page=1&limit=10`),
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Failed to fetch user offers';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchMyOffers(validToken, params)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for createOffer
    describe('createOffer', () => {
      const validToken = 'valid-jwt-token';
      const offerData = {
        title: 'New Offer',
        description: 'Offer Description',
        price: 200,
        category: 'IT'
      };
      const mockResponse = { message: 'Offer created successfully', offerId: '3' };

      test('should return success message when offer creation is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await createOffer(validToken, offerData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/offers`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(offerData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when offer creation fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Invalid offer data';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(createOffer(validToken, offerData)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for updateOffer
    describe('updateOffer', () => {
      const validToken = 'valid-jwt-token';
      const offerId = '1';
      const offerUpdateData = {
        title: 'Updated Offer',
        description: 'Updated Description',
        price: 250
      };
      const mockResponse = { message: 'Offer updated successfully' };

      test('should return success message when offer update is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await updateOffer(validToken, offerId, offerUpdateData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/offers/${offerId}`,
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(offerUpdateData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when offer update fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Offer not found or unauthorized';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(updateOffer(validToken, offerId, offerUpdateData)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for deleteOffer
    describe('deleteOffer', () => {
      const validToken = 'valid-jwt-token';
      const offerId = '1';
      const mockResponse = { message: 'Offer deleted successfully' };

      test('should return success message when offer deletion is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await deleteOffer(validToken, offerId);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/offers/${offerId}`,
          expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when offer deletion fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Offer not found or unauthorized';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(deleteOffer(validToken, offerId)).rejects.toThrow(errorMessage);
      });
    });
  });

  // Tests for Contratacao functions
  describe('Contratacao Functions', () => {
    // Tests for hireOffer
    describe('hireOffer', () => {
      const validToken = 'valid-jwt-token';
      const contratacaoData = {
        offerId: '1',
        startDate: '2023-06-01',
        endDate: '2023-06-30',
        notes: 'Special requirements'
      };
      const mockResponse = { message: 'Offer hired successfully', contratacaoId: '1' };

      test('should return success message when hiring is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await hireOffer(validToken, contratacaoData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/contratacoes`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(contratacaoData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when hiring fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Invalid contratacao data';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(hireOffer(validToken, contratacaoData)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for fetchReceivedContratacoes
    describe('fetchReceivedContratacoes', () => {
      const validToken = 'valid-jwt-token';
      const mockContratacoes = [
        { id: '1', offerId: '1', status: 'pending' },
        { id: '2', offerId: '2', status: 'accepted' }
      ];
      const mockResponse = { contratacoes: mockContratacoes, total: 2 };

      test('should return received contratacoes when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchReceivedContratacoes(validToken);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/contratacoes/received`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Failed to fetch contratacoes';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchReceivedContratacoes(validToken)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for fetchMyHiredContratacoes
    describe('fetchMyHiredContratacoes', () => {
      const validToken = 'valid-jwt-token';
      const mockContratacoes = [
        { id: '1', offerId: '1', status: 'accepted' },
        { id: '2', offerId: '2', status: 'completed' }
      ];
      const mockResponse = { contratacoes: mockContratacoes, total: 2 };

      test('should return hired contratacoes when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchMyHiredContratacoes(validToken);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/contratacoes/hired`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Failed to fetch hired contratacoes';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchMyHiredContratacoes(validToken)).rejects.toThrow(errorMessage);
      });
    });
  });

  // Tests for Payment and Review functions
  describe('Payment and Review Functions', () => {
    // Tests for processPayment
    describe('processPayment', () => {
      const validToken = 'valid-jwt-token';
      const paymentData = {
        contratacaoId: '1',
        amount: 200,
        paymentMethod: 'credit_card',
        cardDetails: {
          number: '4111111111111111',
          expiry: '12/25',
          cvv: '123'
        }
      };
      const mockResponse = { message: 'Payment processed successfully', paymentId: '1' };

      test('should return success message when payment is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await processPayment(validToken, paymentData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/payments`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(paymentData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when payment fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Invalid payment data';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(processPayment(validToken, paymentData)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for submitReview
    describe('submitReview', () => {
      const validToken = 'valid-jwt-token';
      const reviewData = {
        contratacaoId: '1',
        rating: 5,
        comment: 'Excellent service!'
      };
      const mockResponse = { message: 'Review submitted successfully', reviewId: '1' };

      test('should return success message when review submission is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await submitReview(validToken, reviewData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/reviews`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(reviewData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when review submission fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Invalid review data';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(submitReview(validToken, reviewData)).rejects.toThrow(errorMessage);
      });
    });
  });

  // Tests for Curriculo functions
  describe('Curriculo Functions', () => {
    // Tests for saveCurriculo
    describe('saveCurriculo', () => {
      const validToken = 'valid-jwt-token';
      const curriculoData = {
        education: 'Bachelor in Computer Science',
        experience: '5 years as a software developer',
        skills: ['JavaScript', 'React', 'Node.js']
      };
      const mockResponse = { message: 'Curriculo saved successfully', curriculoId: '1' };

      test('should return success message when curriculo save is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await saveCurriculo(validToken, curriculoData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/curriculo`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(curriculoData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when curriculo save fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Invalid curriculo data';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(saveCurriculo(validToken, curriculoData)).rejects.toThrow(errorMessage);
      });
    });
  });

  // Tests for Agenda functions
  describe('Agenda Functions', () => {
    // Tests for fetchAgenda
    describe('fetchAgenda', () => {
      const validToken = 'valid-jwt-token';
      const mockAgenda = [
        { id: '1', date: '2023-06-01', compromissos: [] },
        { id: '2', date: '2023-06-02', compromissos: [] }
      ];
      const mockResponse = { agenda: mockAgenda };

      test('should return agenda when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchAgenda(validToken);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/agenda`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Failed to fetch agenda';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchAgenda(validToken)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for updateCompromissoStatus
    describe('updateCompromissoStatus', () => {
      const validToken = 'valid-jwt-token';
      const agendaId = '1';
      const compromissoId = '1';
      const statusData = {
        status: 'confirmed'
      };
      const mockResponse = { message: 'Compromisso status updated successfully' };

      test('should return success message when status update is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await updateCompromissoStatus(validToken, agendaId, compromissoId, statusData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/agenda/${agendaId}/compromissos/${compromissoId}`,
          expect.objectContaining({
            method: 'PATCH',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(statusData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when status update fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Invalid status data';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(updateCompromissoStatus(validToken, agendaId, compromissoId, statusData)).rejects.toThrow(errorMessage);
      });
    });
  });

  // Tests for Publicacao functions
  describe('Publicacao Functions', () => {
    // Tests for fetchPublicacoes
    describe('fetchPublicacoes', () => {
      const mockPublicacoes = [
        { id: '1', title: 'Publicacao 1', content: 'Content 1' },
        { id: '2', title: 'Publicacao 2', content: 'Content 2' }
      ];
      const mockResponse = { publicacoes: mockPublicacoes, total: 2 };

      test('should return publicacoes when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchPublicacoes();

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/publicacoes`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Failed to fetch publicacoes';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchPublicacoes()).rejects.toThrow(errorMessage);
      });
    });

    // Tests for createPublicacao
    describe('createPublicacao', () => {
      const validToken = 'valid-jwt-token';
      const publicacaoData = {
        title: 'New Publicacao',
        content: 'Publicacao Content',
        tags: ['tag1', 'tag2']
      };
      const mockResponse = { message: 'Publicacao created successfully', publicacaoId: '3' };

      test('should return success message when publicacao creation is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await createPublicacao(validToken, publicacaoData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/publicacoes`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(publicacaoData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when publicacao creation fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Invalid publicacao data';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(createPublicacao(validToken, publicacaoData)).rejects.toThrow(errorMessage);
      });
    });
  });

  // Tests for Notificacao functions
  describe('Notificacao Functions', () => {
    // Tests for fetchNotificacoes
    describe('fetchNotificacoes', () => {
      const validToken = 'valid-jwt-token';
      const mockNotificacoes = [
        { id: '1', message: 'Notification 1', read: false },
        { id: '2', message: 'Notification 2', read: true }
      ];
      const mockResponse = { notificacoes: mockNotificacoes, total: 2 };

      test('should return notificacoes when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchNotificacoes(validToken);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/notificacoes`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Failed to fetch notificacoes';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchNotificacoes(validToken)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for markNotificacaoAsRead
    describe('markNotificacaoAsRead', () => {
      const validToken = 'valid-jwt-token';
      const notificationId = '1';
      const mockResponse = { message: 'Notification marked as read' };

      test('should return success message when marking notification as read is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await markNotificacaoAsRead(validToken, notificationId);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/notificacoes/${notificationId}/read`,
          expect.objectContaining({
            method: 'PATCH',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when marking notification as read fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Notification not found';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(markNotificacaoAsRead(validToken, notificationId)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for deleteNotificacao
    describe('deleteNotificacao', () => {
      const validToken = 'valid-jwt-token';
      const notificationId = '1';
      const mockResponse = { message: 'Notification deleted successfully' };

      test('should return success message when notification deletion is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await deleteNotificacao(validToken, notificationId);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/notificacoes/${notificationId}`,
          expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when notification deletion fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Notification not found';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(deleteNotificacao(validToken, notificationId)).rejects.toThrow(errorMessage);
      });
    });
  });

  // Tests for Negociacao functions
  describe('Negociacao Functions', () => {
    // Tests for iniciarNegociacao
    describe('iniciarNegociacao', () => {
      const validToken = 'valid-jwt-token';
      const negotiationData = {
        contratacaoId: '1',
        message: 'I would like to negotiate the price',
        proposedValue: 180
      };
      const mockResponse = { message: 'Negotiation initiated successfully', negociacaoId: '1' };

      test('should return success message when negotiation initiation is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await iniciarNegociacao(validToken, negotiationData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/negociacoes/iniciar`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(negotiationData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when negotiation initiation fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Invalid negotiation data';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(iniciarNegociacao(validToken, negotiationData)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for responderNegociacao
    describe('responderNegociacao', () => {
      const validToken = 'valid-jwt-token';
      const negociacaoId = '1';
      const responseData = {
        accepted: true,
        message: 'I accept your offer',
        counterProposal: null
      };
      const mockResponse = { message: 'Negotiation response submitted successfully' };

      test('should return success message when negotiation response is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await responderNegociacao(validToken, negociacaoId, responseData);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/negociacoes/${negociacaoId}/responder`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }),
            body: JSON.stringify(responseData),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when negotiation response fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Invalid response data';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(responderNegociacao(validToken, negociacaoId, responseData)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for confirmarNegociacao
    describe('confirmarNegociacao', () => {
      const validToken = 'valid-jwt-token';
      const negociacaoId = '1';
      const mockResponse = { message: 'Negotiation confirmed successfully' };

      test('should return success message when negotiation confirmation is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await confirmarNegociacao(validToken, negociacaoId);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/negociacoes/${negociacaoId}/confirmar`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when negotiation confirmation fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Negotiation not found';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(confirmarNegociacao(validToken, negociacaoId)).rejects.toThrow(errorMessage);
      });
    });

    // Tests for fetchNegociacaoByContratacaoId
    describe('fetchNegociacaoByContratacaoId', () => {
      const validToken = 'valid-jwt-token';
      const contratacaoId = '1';
      const mockNegociacao = {
        id: '1',
        contratacaoId: contratacaoId,
        status: 'pending',
        messages: []
      };
      const mockResponse = { negociacao: mockNegociacao };

      test('should return negociacao when fetch is successful', async () => {
        // Mock successful fetch response
        const mockFetchResponse = {
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        const result = await fetchNegociacaoByContratacaoId(validToken, contratacaoId);

        // Verify fetch was called with correct parameters
        expect(mockedFetch).toHaveBeenCalledWith(
          `${API_URL}/negociacoes/contratacao/${contratacaoId}`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed fetch response
        const errorMessage = 'Negotiation not found';
        const mockFetchResponse = {
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
        };
        mockedFetch.mockResolvedValueOnce(mockFetchResponse as unknown as Response);

        // Verify the function throws the expected error
        await expect(fetchNegociacaoByContratacaoId(validToken, contratacaoId)).rejects.toThrow(errorMessage);
      });
    });
  });

  // Tests for Relatorio functions
  describe('Relatorio Functions', () => {
    // Tests for fetchRelatorio
    describe('fetchRelatorio', () => {
      const validToken = 'valid-jwt-token';
      const mockRelatorio = {
        totalOffers: 10,
        totalContratacoes: 5,
        revenue: 1000
      };
      const mockResponse = { relatorio: mockRelatorio };

      test('should return relatorio when fetch is successful', async () => {
        // Mock successful axios response
        mockedAxios.get.mockResolvedValueOnce({
          status: 200,
          data: mockResponse
        });

        const result = await fetchRelatorio(validToken);

        // Verify axios was called with correct parameters
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `${API_URL}/relatorios`,
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': `Bearer ${validToken}`,
              'Accept': 'application/json',
            }),
          })
        );

        // Verify the result matches the mock response
        expect(result).toEqual(mockResponse);
      });

      test('should throw error when fetch fails', async () => {
        // Mock failed axios response
        const errorMessage = 'Failed to fetch relatorio';
        mockedAxios.get.mockRejectedValueOnce({
          isAxiosError: true,
          response: {
            status: 401,
            data: { message: errorMessage }
          }
        });

        // Verify the function throws the expected error
        await expect(fetchRelatorio(validToken)).rejects.toThrow(errorMessage);
      });
    });
  });
});
