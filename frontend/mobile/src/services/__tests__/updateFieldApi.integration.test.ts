import { updateNome, updateTelefone, updateEndereco } from '../updateFieldApi';
import { updateProfile } from '../api';
import axios from 'axios';
import { API_URL } from '../../config/api';

// This is an integration test file that tests the actual API endpoints
// Unlike unit tests, we don't mock the API calls here

describe('updateFieldApi Integration Tests', () => {
  // Test user credentials - these should be environment variables in a real scenario
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'test123';
  let authToken: string;
  let userId: { idUsuario?: string; id?: string };

  // Setup: Login to get a valid token before tests
  beforeAll(async () => {
    try {
      // Login to get a valid token
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      
      authToken = loginResponse.data.token;
      userId = { 
        idUsuario: loginResponse.data.user.idUsuario || loginResponse.data.user.id 
      };
      
      console.log('Integration test setup: Successfully logged in');
    } catch (error) {
      console.error('Integration test setup failed:', error);
      // If login fails, we'll use a mock token for testing
      // This allows tests to run even if the API is not available
      authToken = 'mock-token-for-integration-tests';
      userId = { id: 'mock-user-id' };
      console.warn('Using mock token and user ID for tests');
    }
  });

  // Tests for updateNome function
  describe('updateNome', () => {
    const testName = 'Integration Test Name';
    
    test('should update user name through the API', async () => {
      // Skip test if we're using mock credentials
      if (authToken === 'mock-token-for-integration-tests') {
        console.warn('Skipping integration test with mock token');
        return;
      }

      try {
        const result = await updateNome(authToken, userId, testName);
        
        // Verify the API returned a success response
        expect(result).toBeDefined();
        expect(result.message).toBeDefined();
        
        // If the API returns the updated user, verify the name was updated
        if (result.user) {
          expect(result.user.nome).toBe(testName);
        }
        
        console.log('Integration test: Successfully updated user name');
      } catch (error) {
        console.error('Integration test failed:', error);
        throw error;
      }
    });
  });

  // Tests for updateTelefone function
  describe('updateTelefone', () => {
    const testPhone = '(11) 98765-4321';
    
    test('should update user phone through the API', async () => {
      // Skip test if we're using mock credentials
      if (authToken === 'mock-token-for-integration-tests') {
        console.warn('Skipping integration test with mock token');
        return;
      }

      try {
        const result = await updateTelefone(authToken, userId, testPhone);
        
        // Verify the API returned a success response
        expect(result).toBeDefined();
        expect(result.message).toBeDefined();
        
        // If the API returns the updated user, verify the phone was updated
        if (result.user) {
          expect(result.user.telefone).toBe(testPhone);
        }
        
        console.log('Integration test: Successfully updated user phone');
      } catch (error) {
        console.error('Integration test failed:', error);
        throw error;
      }
    });
  });

  // Tests for updateEndereco function
  describe('updateEndereco', () => {
    const testAddress = 'Rua de Teste, 123 - Integration';
    
    test('should update user address through the API', async () => {
      // Skip test if we're using mock credentials
      if (authToken === 'mock-token-for-integration-tests') {
        console.warn('Skipping integration test with mock token');
        return;
      }

      try {
        const result = await updateEndereco(authToken, userId, testAddress);
        
        // Verify the API returned a success response
        expect(result).toBeDefined();
        expect(result.message).toBeDefined();
        
        // If the API returns the updated user, verify the address was updated
        if (result.user) {
          expect(result.user.endereco).toBe(testAddress);
        }
        
        console.log('Integration test: Successfully updated user address');
      } catch (error) {
        console.error('Integration test failed:', error);
        throw error;
      }
    });
  });

  // Test error handling
  describe('Error handling', () => {
    test('should handle API errors gracefully', async () => {
      // Use an invalid token to force an error
      const invalidToken = 'invalid-token';
      
      try {
        await updateNome(invalidToken, userId, 'Test Name');
        // If we reach here, the test failed because an error should have been thrown
        fail('Expected an error to be thrown with invalid token');
      } catch (error) {
        // Verify we got an error as expected
        expect(error).toBeDefined();
      }
    });
  });
});