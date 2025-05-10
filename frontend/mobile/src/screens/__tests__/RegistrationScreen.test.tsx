import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegistrationScreen from '../RegistrationScreen';
import { register as apiRegister } from '../../services/api';

// Mock the dependencies
jest.mock('../../services/api', () => ({
  register: jest.fn(),
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('RegistrationScreen', () => {
  // Setup common test variables
  const mockRegistrationData = {
    nome: 'Test User',
    email: 'test@example.com',
    senha: 'password123',
    telefone: '11999999999',
    cpfCnpj: '12345678900',
    tipoUsuario: 'comprador',
    endereco: 'Test Address',
    foto: 'https://example.com/photo.jpg',
  };
  
  const mockRegistrationResponse = {
    message: 'Usuário cadastrado com sucesso',
    user: { id: '123', ...mockRegistrationData }
  };
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    apiRegister.mockResolvedValue(mockRegistrationResponse);
  });
  
  test('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <RegistrationScreen navigation={mockNavigation as any} />
    );
    
    // Check if the main elements are rendered
    expect(getByText('Cadastro')).toBeTruthy();
    expect(getByPlaceholderText('Nome *')).toBeTruthy();
    expect(getByPlaceholderText('Email *')).toBeTruthy();
    expect(getByPlaceholderText('Senha *')).toBeTruthy();
    expect(getByPlaceholderText('Telefone')).toBeTruthy();
    expect(getByPlaceholderText('CPF/CNPJ *')).toBeTruthy();
    expect(getByPlaceholderText('Endereço')).toBeTruthy();
    expect(getByPlaceholderText('URL da Foto de Perfil')).toBeTruthy();
    expect(getByText('Tipo de Usuário *')).toBeTruthy();
    expect(getByText('Comprador')).toBeTruthy();
    expect(getByText('Prestador')).toBeTruthy();
    expect(getByText('Anunciante')).toBeTruthy();
    expect(getByText('Cadastrar')).toBeTruthy();
  });
  
  test('shows error alert when submitting with empty required fields', () => {
    const { getByText } = render(
      <RegistrationScreen navigation={mockNavigation as any} />
    );
    
    // Try to register without filling the required fields
    fireEvent.press(getByText('Cadastrar'));
    
    // Check if the alert was shown with the correct message
    expect(Alert.alert).toHaveBeenCalledWith(
      'Erro de Validação', 
      'Os campos Nome, Email, Senha e CPF/CNPJ são obrigatórios.'
    );
    
    // Verify that the API register function was not called
    expect(apiRegister).not.toHaveBeenCalled();
  });
  
  test('handles successful registration', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RegistrationScreen navigation={mockNavigation as any} />
    );
    
    // Fill the form with required fields
    fireEvent.changeText(getByPlaceholderText('Nome *'), mockRegistrationData.nome);
    fireEvent.changeText(getByPlaceholderText('Email *'), mockRegistrationData.email);
    fireEvent.changeText(getByPlaceholderText('Senha *'), mockRegistrationData.senha);
    fireEvent.changeText(getByPlaceholderText('CPF/CNPJ *'), mockRegistrationData.cpfCnpj);
    
    // Submit the form
    fireEvent.press(getByText('Cadastrar'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the API register function was called with the correct parameters
      expect(apiRegister).toHaveBeenCalledWith({
        nome: mockRegistrationData.nome,
        email: mockRegistrationData.email,
        senha: mockRegistrationData.senha,
        cpfCnpj: mockRegistrationData.cpfCnpj,
        tipoUsuario: 'comprador', // Default value
        telefone: undefined,
        endereco: undefined,
        foto: undefined,
      });
      
      // Check if the success alert was shown
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso', mockRegistrationResponse.message);
      
      // Check if navigation to Login screen happened
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });
  
  test('handles registration with all fields filled', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RegistrationScreen navigation={mockNavigation as any} />
    );
    
    // Fill all form fields
    fireEvent.changeText(getByPlaceholderText('Nome *'), mockRegistrationData.nome);
    fireEvent.changeText(getByPlaceholderText('Email *'), mockRegistrationData.email);
    fireEvent.changeText(getByPlaceholderText('Senha *'), mockRegistrationData.senha);
    fireEvent.changeText(getByPlaceholderText('Telefone'), mockRegistrationData.telefone);
    fireEvent.changeText(getByPlaceholderText('CPF/CNPJ *'), mockRegistrationData.cpfCnpj);
    fireEvent.changeText(getByPlaceholderText('Endereço'), mockRegistrationData.endereco);
    fireEvent.changeText(getByPlaceholderText('URL da Foto de Perfil'), mockRegistrationData.foto);
    
    // Select user type (prestador)
    fireEvent.press(getByText('Prestador'));
    
    // Submit the form
    fireEvent.press(getByText('Cadastrar'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the API register function was called with the correct parameters
      expect(apiRegister).toHaveBeenCalledWith({
        nome: mockRegistrationData.nome,
        email: mockRegistrationData.email,
        senha: mockRegistrationData.senha,
        telefone: mockRegistrationData.telefone,
        cpfCnpj: mockRegistrationData.cpfCnpj,
        tipoUsuario: 'prestador', // Changed from default
        endereco: mockRegistrationData.endereco,
        foto: mockRegistrationData.foto,
      });
      
      // Check if navigation to Login screen happened
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });
  
  test('handles registration error from API', async () => {
    // Setup API register to reject with an error
    const errorMessage = 'Email já cadastrado';
    apiRegister.mockRejectedValueOnce(new Error(errorMessage));
    
    const { getByText, getByPlaceholderText } = render(
      <RegistrationScreen navigation={mockNavigation as any} />
    );
    
    // Fill the required fields
    fireEvent.changeText(getByPlaceholderText('Nome *'), mockRegistrationData.nome);
    fireEvent.changeText(getByPlaceholderText('Email *'), mockRegistrationData.email);
    fireEvent.changeText(getByPlaceholderText('Senha *'), mockRegistrationData.senha);
    fireEvent.changeText(getByPlaceholderText('CPF/CNPJ *'), mockRegistrationData.cpfCnpj);
    
    // Submit the form
    fireEvent.press(getByText('Cadastrar'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the alert was shown with the correct error message
      expect(Alert.alert).toHaveBeenCalledWith('Erro no Cadastro', errorMessage);
      
      // Check that navigation did not happen
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });
  
  test('disables inputs and button during registration process', async () => {
    // Setup API register to resolve after a delay
    apiRegister.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve(mockRegistrationResponse), 100);
    }));
    
    const { getByText, getByPlaceholderText } = render(
      <RegistrationScreen navigation={mockNavigation as any} />
    );
    
    // Get references to the inputs and button
    const nomeInput = getByPlaceholderText('Nome *');
    const emailInput = getByPlaceholderText('Email *');
    const senhaInput = getByPlaceholderText('Senha *');
    const cpfCnpjInput = getByPlaceholderText('CPF/CNPJ *');
    const registerButton = getByText('Cadastrar');
    
    // Fill the required fields
    fireEvent.changeText(nomeInput, mockRegistrationData.nome);
    fireEvent.changeText(emailInput, mockRegistrationData.email);
    fireEvent.changeText(senhaInput, mockRegistrationData.senha);
    fireEvent.changeText(cpfCnpjInput, mockRegistrationData.cpfCnpj);
    
    // Submit the form
    fireEvent.press(registerButton);
    
    // Check that the button text changes to "Cadastrando..."
    expect(getByText('Cadastrando...')).toBeTruthy();
    
    // Check that the inputs and button are disabled during registration
    expect(nomeInput.props.editable).toBe(false);
    expect(emailInput.props.editable).toBe(false);
    expect(senhaInput.props.editable).toBe(false);
    expect(cpfCnpjInput.props.editable).toBe(false);
    expect(registerButton.props.disabled).toBe(true);
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check that navigation to Login screen happened
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });
  
  test('changes user type when type buttons are pressed', () => {
    const { getByText } = render(
      <RegistrationScreen navigation={mockNavigation as any} />
    );
    
    // Get references to the user type buttons
    const compradorButton = getByText('Comprador');
    const prestadorButton = getByText('Prestador');
    const anuncianteButton = getByText('Anunciante');
    
    // Check that comprador is selected by default (has the active color)
    expect(compradorButton.props.color).toBe('#3498db');
    expect(prestadorButton.props.color).toBe('#bdc3c7');
    expect(anuncianteButton.props.color).toBe('#bdc3c7');
    
    // Press the prestador button
    fireEvent.press(prestadorButton);
    
    // Check that prestador is now selected
    expect(compradorButton.props.color).toBe('#bdc3c7');
    expect(prestadorButton.props.color).toBe('#3498db');
    expect(anuncianteButton.props.color).toBe('#bdc3c7');
    
    // Press the anunciante button
    fireEvent.press(anuncianteButton);
    
    // Check that anunciante is now selected
    expect(compradorButton.props.color).toBe('#bdc3c7');
    expect(prestadorButton.props.color).toBe('#bdc3c7');
    expect(anuncianteButton.props.color).toBe('#3498db');
  });
});