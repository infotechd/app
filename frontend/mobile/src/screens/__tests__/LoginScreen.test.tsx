import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../LoginScreen';
import { login as apiLogin } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Mock the dependencies
jest.mock('../../services/api', () => ({
  login: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('LoginScreen', () => {
  // Setup common test variables
  const mockContextLogin = jest.fn();
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
    useAuth.mockReturnValue({
      login: mockContextLogin,
    });

    apiLogin.mockResolvedValue(mockLoginResponse);
  });

  test('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    // Check if the main elements are rendered
    expect(getByText('Login')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
    expect(getByText('Entrar')).toBeTruthy();
    expect(getByText('Não tem conta? Cadastre-se')).toBeTruthy();
  });

  test('shows error alert when submitting with empty fields', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    // Try to login without filling the fields
    fireEvent.press(getByText('Entrar'));

    // Check if the alert was shown with the correct message
    expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Preencha email e senha.');

    // Verify that the API login function was not called
    expect(apiLogin).not.toHaveBeenCalled();
  });

  test('handles successful login', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation as any} />
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

      // Check if the context login function was called with the correct user data
      expect(mockContextLogin).toHaveBeenCalledWith({
        ...mockUser,
        token: mockToken,
      });

      // Check if navigation to Home screen happened
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
    });
  });

  test('handles login error from API', async () => {
    // Setup API login to reject with an error
    const errorMessage = 'Invalid credentials';
    apiLogin.mockRejectedValueOnce(new Error(errorMessage));

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation as any} />
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

      // Check that context login was not called
      expect(mockContextLogin).not.toHaveBeenCalled();

      // Check that navigation did not happen
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });

  test('disables inputs and button during login process', async () => {
    // Setup API login to resolve after a delay
    apiLogin.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve(mockLoginResponse), 100);
    }));

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    // Get references to the inputs and button
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Senha');
    const loginButton = getByText('Entrar');

    // Fill the form
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    // Submit the form
    fireEvent.press(loginButton);

    // Check that the button text changes to "Entrando..."
    expect(getByText('Entrando...')).toBeTruthy();

    // Check that the inputs and button are disabled during login
    expect(emailInput.props.editable).toBe(false);
    expect(passwordInput.props.editable).toBe(false);
    expect(loginButton.props.disabled).toBe(true);

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check that navigation to Home screen happened
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
    });
  });

  test('navigates to Registration screen when registration button is pressed', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    // Press the registration button
    fireEvent.press(getByText('Não tem conta? Cadastre-se'));

    // Check if navigation to Registration screen happened
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Registration');
  });

  test('handles missing idUsuario in API response', async () => {
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
      <LoginScreen navigation={mockNavigation as any} />
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

      // Check that context login was not called
      expect(mockContextLogin).not.toHaveBeenCalled();

      // Check that navigation did not happen
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });

  test('handles missing token in API response', async () => {
    // Setup API login to return a response without token
    const responseWithoutToken = { user: mockUser, token: undefined };
    apiLogin.mockResolvedValueOnce(responseWithoutToken);

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation as any} />
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
        'Erro de validação: user.token: Required'
      );

      // Check that context login was not called
      expect(mockContextLogin).not.toHaveBeenCalled();

      // Check that navigation did not happen
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });
});
