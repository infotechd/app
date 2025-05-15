import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NewEditProfileScreen from '../NewEditProfileScreen';
import { updateNome, updateTelefone, updateEndereco } from '../../services/updateFieldApi';
import { uploadImage } from '../../services/uploadApi';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

// Mock the dependencies
jest.mock('../../services/updateFieldApi', () => ({
  updateNome: jest.fn(),
  updateTelefone: jest.fn(),
  updateEndereco: jest.fn(),
}));

jest.mock('../../services/uploadApi', () => ({
  uploadImage: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaType: {
    Images: 'Images',
  },
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    control: {},
    handleSubmit: jest.fn(cb => data => cb(data)),
    setValue: jest.fn(),
    formState: { errors: {} },
    reset: jest.fn(),
  })),
  Controller: ({ render }) => render({ field: { onChange: jest.fn(), onBlur: jest.fn(), value: '' } }),
}));

// Mock zod resolver
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => jest.fn()),
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => null);

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
};

describe('NewEditProfileScreen', () => {
  // Setup common test variables
  const mockUpdateUser = jest.fn();
  const mockUser = { 
    id: '123',
    idUsuario: '123',
    nome: 'Test User', 
    email: 'test@example.com',
    token: 'mock-jwt-token',
    telefone: '123456789',
    endereco: 'Test Address',
    foto: 'https://example.com/photo.jpg'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    useAuth.mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
    });

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

  test('renders correctly with user data', () => {
    const { getByText, getByPlaceholderText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Check if the main elements are rendered
    expect(getByText('Editar Perfil')).toBeTruthy();

    // Check if form fields are populated with user data
    expect(getByPlaceholderText('Nome').props.value).toBe(mockUser.nome);
    expect(getByPlaceholderText('Email').props.value).toBe(mockUser.email);
    expect(getByPlaceholderText('Telefone').props.value).toBe(mockUser.telefone);
    expect(getByPlaceholderText('Endereço').props.value).toBe(mockUser.endereco);
  });

  test('handles form input changes', async () => {
    const { getByPlaceholderText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Change form field values
    fireEvent.changeText(getByPlaceholderText('Nome'), 'New Name');
    fireEvent.changeText(getByPlaceholderText('Telefone'), '987654321');
    fireEvent.changeText(getByPlaceholderText('Endereço'), 'New Address');

    // Check if form fields are updated
    await waitFor(() => {
      expect(getByPlaceholderText('Nome').props.value).toBe('New Name');
      expect(getByPlaceholderText('Telefone').props.value).toBe('987654321');
      expect(getByPlaceholderText('Endereço').props.value).toBe('New Address');
    });
  });

  test('updates nome field when save button is clicked', async () => {
    const { getByPlaceholderText, getAllByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
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

      // Check if updateUser was called with the updated user data
      expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
        nome: 'Updated Name'
      }));
    });
  });

  test('updates telefone field when save button is clicked', async () => {
    const { getByPlaceholderText, getAllByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
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

      // Check if updateUser was called with the updated user data
      expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
        telefone: '987654321'
      }));
    });
  });

  test('updates endereco field when save button is clicked', async () => {
    const { getByPlaceholderText, getAllByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
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

      // Check if updateUser was called with the updated user data
      expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
        endereco: 'Updated Address'
      }));
    });
  });

  test('shows success status after successful nome update', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
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
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
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

  test('redirects to login if user token is missing', async () => {
    // Setup useAuth to return null user token
    useAuth.mockReturnValue({
      user: { ...mockUser, token: null },
      updateUser: mockUpdateUser,
    });

    const { getByPlaceholderText, getAllByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
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
    // Setup useAuth to return null user
    useAuth.mockReturnValue({
      user: null,
      updateUser: mockUpdateUser,
    });

    const { getByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Check if loading indicator is shown
    expect(getByText('Carregando perfil...')).toBeTruthy();
  });

  test('handles email change modal opening and closing', async () => {
    const { getByText, queryByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
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

  test('does not update field if value is unchanged', async () => {
    const { getByPlaceholderText, getAllByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Don't change the nome field value (keep it as mockUser.nome)
    
    // Find and click the save button for nome field
    const saveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar nome'
    );
    fireEvent.press(saveButtons[0]);

    // Wait to ensure updateNome is not called
    await waitFor(() => {
      expect(updateNome).not.toHaveBeenCalled();
    });
  });

  test('handles profile image selection and update', async () => {
    const { getByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
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

    // Check if updateUser was called with the updated photo URL
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
        foto: 'https://example.com/uploaded-photo.jpg'
      }));
    });
  });
});