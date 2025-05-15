import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NewEditProfileScreen from '../NewEditProfileScreen';
import { updateNome, updateTelefone, updateEndereco } from '../../services/updateFieldApi';
import { uploadImage } from '../../services/uploadApi';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

// Mock the API functions
jest.mock('../../services/updateFieldApi', () => ({
  updateNome: jest.fn(),
  updateTelefone: jest.fn(),
  updateEndereco: jest.fn(),
}));

jest.mock('../../services/uploadApi', () => ({
  uploadImage: jest.fn(),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaType: {
    Images: 'Images',
  },
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => null);

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
};

// Create a wrapper component that provides the AuthContext with a mock user
const NewEditProfileWithAuth = ({ navigation, initialUser }: any) => {
  // Mock the useAuth hook directly
  jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
    user: initialUser,
    updateUser: jest.fn().mockImplementation(userData => Promise.resolve(userData)),
    logout: jest.fn().mockImplementation(() => Promise.resolve()),
    isLoading: false
  }));

  return <NewEditProfileScreen navigation={navigation} />;
};

describe('NewEditProfileScreen Integration Tests', () => {
  // Setup common test variables
  const mockUser = { 
    idUsuario: '123', 
    id: '123',
    nome: 'Test User', 
    email: 'test@example.com',
    tipoUsuario: 'comprador',
    token: 'mock-jwt-token',
    telefone: '123456789',
    endereco: 'Test Address',
    foto: 'https://example.com/photo.jpg'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    updateNome.mockResolvedValue({
      message: 'Nome updated successfully',
      user: {
        ...mockUser,
        nome: 'Updated Name'
      }
    });

    updateTelefone.mockResolvedValue({
      message: 'Telefone updated successfully',
      user: {
        ...mockUser,
        telefone: '987654321'
      }
    });

    updateEndereco.mockResolvedValue({
      message: 'Endereco updated successfully',
      user: {
        ...mockUser,
        endereco: 'Updated Address'
      }
    });

    uploadImage.mockResolvedValue({
      message: 'Image uploaded successfully',
      imageUrl: 'https://example.com/uploaded-photo.jpg'
    });

    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'granted'
    });

    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///path/to/local/image.jpg' }]
    });
  });

  test('renders correctly with user data from AuthContext', async () => {
    const { getByText, getByPlaceholderText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Check if the main elements are rendered
    expect(getByText('Editar Perfil')).toBeTruthy();

    // Check if user data is displayed in the form
    expect(getByPlaceholderText('Nome').props.value).toBe(mockUser.nome);
    expect(getByPlaceholderText('Email').props.value).toBe(mockUser.email);
    expect(getByPlaceholderText('Telefone').props.value).toBe(mockUser.telefone);
    expect(getByPlaceholderText('Endereço').props.value).toBe(mockUser.endereco);
  });

  test('updates nome field when save button is clicked', async () => {
    const { getByPlaceholderText, getAllByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Change nome field value
    fireEvent.changeText(getByPlaceholderText('Nome'), 'Updated Name');

    // Find and click the save button for nome field
    const saveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar nome'
    );
    fireEvent.press(saveButtons[0]);

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if updateNome was called with the correct parameters
      expect(updateNome).toHaveBeenCalledWith(
        mockUser.token,
        { id: mockUser.id, idUsuario: mockUser.idUsuario },
        'Updated Name'
      );
    });
  });

  test('updates telefone field when save button is clicked', async () => {
    const { getByPlaceholderText, getAllByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Change telefone field value
    fireEvent.changeText(getByPlaceholderText('Telefone'), '987654321');

    // Find and click the save button for telefone field
    const saveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar telefone'
    );
    fireEvent.press(saveButtons[0]);

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if updateTelefone was called with the correct parameters
      expect(updateTelefone).toHaveBeenCalledWith(
        mockUser.token,
        { id: mockUser.id, idUsuario: mockUser.idUsuario },
        '987654321'
      );
    });
  });

  test('updates endereco field when save button is clicked', async () => {
    const { getByPlaceholderText, getAllByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Change endereco field value
    fireEvent.changeText(getByPlaceholderText('Endereço'), 'Updated Address');

    // Find and click the save button for endereco field
    const saveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar endereço'
    );
    fireEvent.press(saveButtons[0]);

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if updateEndereco was called with the correct parameters
      expect(updateEndereco).toHaveBeenCalledWith(
        mockUser.token,
        { id: mockUser.id, idUsuario: mockUser.idUsuario },
        'Updated Address'
      );
    });
  });

  test('shows success status after successful nome update', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Change nome field value
    fireEvent.changeText(getByPlaceholderText('Nome'), 'Updated Name');

    // Find and click the save button for nome field
    const saveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar nome'
    );
    fireEvent.press(saveButtons[0]);

    // Wait for the success message to appear
    await waitFor(() => {
      expect(getByText('Nome atualizado com sucesso!')).toBeTruthy();
    });
  });

  test('shows error status after failed nome update', async () => {
    // Setup updateNome to reject with an error
    updateNome.mockRejectedValueOnce(new Error('Failed to update nome'));

    const { getByPlaceholderText, getAllByText, getByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Change nome field value
    fireEvent.changeText(getByPlaceholderText('Nome'), 'Updated Name');

    // Find and click the save button for nome field
    const saveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar nome'
    );
    fireEvent.press(saveButtons[0]);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(getByText('Erro ao atualizar nome. Tente novamente.')).toBeTruthy();
    });
  });

  test('handles email change modal opening and closing', async () => {
    const { getByText, queryByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Open the email change modal
    fireEvent.press(getByText('Alterar'));

    // Now the modal should be visible
    await waitFor(() => {
      expect(getByText('Alterar Email')).toBeTruthy();
    });

    // Close the modal by pressing Cancel
    fireEvent.press(getByText('Cancelar'));

    // The modal should be closed
    await waitFor(() => {
      expect(queryByText('Alterar Email')).toBeNull();
    });
  });

  test('redirects to login if user token is missing', async () => {
    // Create a user without a token
    const userWithoutToken = { ...mockUser, token: undefined };

    const { getByPlaceholderText, getAllByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={userWithoutToken} />
    );

    // Change nome field value and try to save
    fireEvent.changeText(getByPlaceholderText('Nome'), 'Updated Name');
    const saveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar nome'
    );
    fireEvent.press(saveButtons[0]);

    // Wait for the navigation to happen
    await waitFor(() => {
      expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
    });
  });

  test('shows loading indicator when user data is not available', () => {
    const { getByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={null} />
    );

    // Check if loading indicator is shown
    expect(getByText('Carregando perfil...')).toBeTruthy();
  });

  test('handles profile image selection and update', async () => {
    const { getByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Find and click the profile image picker
    fireEvent.press(getByText('Selecionar Foto'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if ImagePicker.requestMediaLibraryPermissionsAsync was called
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      // Check if ImagePicker.launchImageLibraryAsync was called
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });

    // Check if uploadImage was called
    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalled();
    });
  });

  test('handles denied image permissions', async () => {
    // Setup ImagePicker to return denied permission
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
      status: 'denied'
    });

    const { getByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Attempt to select an image
    fireEvent.press(getByText('Selecionar Foto'));

    // Wait for the permission check to complete
    await waitFor(() => {
      // Check if the alert was shown with the correct message
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permissão negada', 
        'Precisamos de permissão para acessar suas fotos.'
      );

      // Check that the image picker was not launched
      expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    });
  });

  test('handles canceled image selection', async () => {
    // Setup ImagePicker to return a canceled result
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: true,
      assets: []
    });

    const { getByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Attempt to select an image
    fireEvent.press(getByText('Selecionar Foto'));

    // Wait for the image picker to complete
    await waitFor(() => {
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });

    // Check that uploadImage was not called
    await waitFor(() => {
      expect(uploadImage).not.toHaveBeenCalled();
    });
  });

  test('handles missing image URI', async () => {
    // Setup ImagePicker to return a result with assets but no URI
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ /* No URI property */ }]
    });

    const { getByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Attempt to select an image
    fireEvent.press(getByText('Selecionar Foto'));

    // Wait for the image picker to complete
    await waitFor(() => {
      // Check if the alert was shown with the correct error message
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro', 
        'Não foi possível obter a URI da imagem selecionada.'
      );
    });
  });

  test('handles error during image selection', async () => {
    // Setup ImagePicker to throw an error
    const errorMessage = 'Failed to select image';
    ImagePicker.launchImageLibraryAsync.mockRejectedValueOnce(new Error(errorMessage));

    const { getByText } = render(
      <NewEditProfileWithAuth navigation={mockNavigation} initialUser={mockUser} />
    );

    // Attempt to select an image
    fireEvent.press(getByText('Selecionar Foto'));

    // Wait for the error to be handled
    await waitFor(() => {
      // Check if the alert was shown with the correct error message
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro', 
        'Não foi possível selecionar a imagem.'
      );
    });
  });
});