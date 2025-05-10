import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../LoginScreen';
import { login as apiLogin } from '../../services/api';
import { AuthProvider, useAuth } from '../../context/AuthContext';

// Mock the API login function
jest.mock('../../services/api', () => ({
  login: jest.fn(),
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Create a wrapper component that provides the AuthContext
const LoginScreenWithAuth = ({ navigation }: any) => (
  <AuthProvider>
    <LoginScreen navigation={navigation} />
  </AuthProvider>
);

describe('LoginScreen Integration Tests', () => {
  // Setup common test variables
  const mockUser = { 
    id: '123', 
    nome: 'Test User', 
    email: 'test@example.com',
    tipoUsuario: 'comprador',
    idUsuario: '123'
  };
  const mockToken = 'mock-jwt-token';
  const mockLoginResponse = { user: mockUser, token: mockToken };
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    apiLogin.mockResolvedValue(mockLoginResponse);
  });
  
  test('integrates with AuthContext on successful login', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreenWithAuth navigation={mockNavigation} />
    );
    
    // Fill the form
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Entrar'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the API login function was called with the correct parameters
      expect(apiLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      
      // Check if navigation to Home screen happened
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
    });
  });
  
  test('handles API errors correctly', async () => {
    // Setup API login to reject with an error
    const errorMessage = 'Invalid credentials';
    apiLogin.mockRejectedValueOnce(new Error(errorMessage));
    
    const { getByText, getByPlaceholderText } = render(
      <LoginScreenWithAuth navigation={mockNavigation} />
    );
    
    // Fill the form
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'wrong-password');
    
    // Submit the form
    fireEvent.press(getByText('Entrar'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the alert was shown with the correct error message
      expect(Alert.alert).toHaveBeenCalledWith('Erro no Login', errorMessage);
      
      // Check that navigation did not happen
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });
  
  test('handles validation errors correctly', async () => {
    // Setup API login to return a response without idUsuario
    const incompleteUser = { 
      id: undefined, 
      nome: 'Test User', 
      email: 'test@example.com',
      tipoUsuario: 'comprador'
    };
    const incompleteResponse = { user: incompleteUser, token: mockToken };
    apiLogin.mockResolvedValueOnce(incompleteResponse);
    
    const { getByText, getByPlaceholderText } = render(
      <LoginScreenWithAuth navigation={mockNavigation} />
    );
    
    // Fill the form
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Entrar'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the alert was shown with the validation error message
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro no Login', 
        'Erro de validação: user.idUsuario: Required'
      );
      
      // Check that navigation did not happen
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });
});