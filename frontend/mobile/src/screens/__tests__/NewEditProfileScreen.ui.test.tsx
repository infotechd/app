import React from 'react';
import { render, fireEvent, waitFor, within } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NewEditProfileScreen from '../NewEditProfileScreen';
import { updateNome, updateTelefone, updateEndereco } from '../../services/updateFieldApi';
import { useAuth } from '../../context/AuthContext';

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
    formState: { 
      errors: {} 
    },
    reset: jest.fn(),
    trigger: jest.fn().mockResolvedValue(true),
  })),
  Controller: ({ render, name }) => render({ 
    field: { 
      onChange: jest.fn(), 
      onBlur: jest.fn(), 
      value: name === 'nome' ? 'Test User' : 
             name === 'telefone' ? '123456789' : 
             name === 'endereco' ? 'Test Address' : ''
    } 
  }),
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

describe('NewEditProfileScreen UI Tests', () => {
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
  });

  // Test 1: Verify all elements have proper accessibility labels
  test('all interactive elements have proper accessibility labels', () => {
    const { getAllByRole } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Get all textinputs and buttons
    const textInputs = getAllByRole('textbox');
    
    // Check that each input has accessibility properties
    textInputs.forEach(input => {
      expect(input.props.accessibilityLabel).toBeTruthy();
      expect(input.props.accessibilityHint).toBeTruthy();
    });
    
    // Check save buttons
    const saveButtons = getAllByRole('button', { name: /salvar/i });
    saveButtons.forEach(button => {
      expect(button.props.accessibilityLabel).toBeTruthy();
      expect(button.props.accessibilityHint).toBeTruthy();
    });
  });

  // Test 2: Test visual feedback for loading state
  test('shows loading indicators when updating fields', async () => {
    // Make the API calls take longer to ensure loading state is visible
    updateNome.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          message: 'Nome updated successfully',
          user: { ...mockUser, nome: 'Updated Name' }
        });
      }, 100);
    }));

    const { getByPlaceholderText, getAllByText, getByTestId } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Change nome field value
    fireEvent.changeText(getByPlaceholderText('Nome'), 'Updated Name');

    // Find and click the save button for nome field
    const saveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar nome'
    );
    fireEvent.press(saveButtons[0]);

    // Check if loading indicator is shown
    await waitFor(() => {
      const loadingIndicator = getByTestId('nome-loading-indicator');
      expect(loadingIndicator).toBeTruthy();
    });
  });

  // Test 3: Test form validation errors
  test('displays validation errors for invalid inputs', async () => {
    // Mock form errors
    jest.mock('react-hook-form', () => ({
      ...jest.requireActual('react-hook-form'),
      useForm: jest.fn(() => ({
        control: {},
        handleSubmit: jest.fn(cb => data => cb(data)),
        setValue: jest.fn(),
        formState: { 
          errors: {
            nome: { message: 'Nome é obrigatório' },
            telefone: { message: 'Telefone inválido' },
            endereco: { message: 'Endereço é obrigatório' }
          } 
        },
        reset: jest.fn(),
        trigger: jest.fn().mockResolvedValue(false),
      })),
    }));

    const { getByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Check if error messages are displayed
    expect(getByText('Nome é obrigatório')).toBeTruthy();
    expect(getByText('Telefone inválido')).toBeTruthy();
    expect(getByText('Endereço é obrigatório')).toBeTruthy();
  });

  // Test 4: Test success and error visual feedback
  test('shows success and error visual feedback', async () => {
    // Mock successful nome update
    updateNome.mockResolvedValueOnce({
      message: 'Nome updated successfully',
      user: { ...mockUser, nome: 'Updated Name' }
    });

    // Mock failed telefone update
    updateTelefone.mockRejectedValueOnce(new Error('Failed to update telefone'));

    const { getByPlaceholderText, getAllByText, getByText, queryByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Update nome (should succeed)
    fireEvent.changeText(getByPlaceholderText('Nome'), 'Updated Name');
    const nomeSaveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar nome'
    );
    fireEvent.press(nomeSaveButtons[0]);

    // Wait for success message
    await waitFor(() => {
      expect(getByText('Nome atualizado com sucesso!')).toBeTruthy();
    });

    // Update telefone (should fail)
    fireEvent.changeText(getByPlaceholderText('Telefone'), '987654321');
    const telefoneSaveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar telefone'
    );
    fireEvent.press(telefoneSaveButtons[0]);

    // Wait for error message
    await waitFor(() => {
      expect(getByText('Erro ao atualizar telefone. Tente novamente.')).toBeTruthy();
    });

    // Check that success message disappears after timeout
    await waitFor(() => {
      expect(queryByText('Nome atualizado com sucesso!')).toBeNull();
    }, { timeout: 4000 });

    // Check that error message disappears after timeout
    await waitFor(() => {
      expect(queryByText('Erro ao atualizar telefone. Tente novamente.')).toBeNull();
    }, { timeout: 4000 });
  });

  // Test 5: Test keyboard interaction and dismissal
  test('keyboard can be dismissed by tapping outside', async () => {
    const { getByTestId } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Mock Keyboard.dismiss
    const mockDismiss = jest.fn();
    jest.mock('react-native', () => ({
      ...jest.requireActual('react-native'),
      Keyboard: {
        dismiss: mockDismiss
      }
    }));

    // Tap on the TouchableWithoutFeedback wrapper
    fireEvent.press(getByTestId('keyboard-dismiss-wrapper'));

    // Check if Keyboard.dismiss was called
    expect(mockDismiss).toHaveBeenCalled();
  });

  // Test 6: Test screen responsiveness with different user data
  test('renders correctly with minimal user data', () => {
    // Setup minimal user data
    const minimalUser = {
      id: '123',
      token: 'mock-jwt-token',
      email: 'minimal@example.com',
    };

    useAuth.mockReturnValue({
      user: minimalUser,
      updateUser: mockUpdateUser,
    });

    const { getByPlaceholderText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Check that fields are empty or have default values
    expect(getByPlaceholderText('Nome').props.value).toBe('');
    expect(getByPlaceholderText('Email').props.value).toBe('minimal@example.com');
    expect(getByPlaceholderText('Telefone').props.value).toBe('');
    expect(getByPlaceholderText('Endereço').props.value).toBe('');
  });

  // Test 7: Test that fields are disabled during loading
  test('fields are disabled during loading', async () => {
    // Make the API call take longer
    updateNome.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          message: 'Nome updated successfully',
          user: { ...mockUser, nome: 'Updated Name' }
        });
      }, 100);
    }));

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

    // Check if the field is disabled during loading
    await waitFor(() => {
      expect(getByPlaceholderText('Nome').props.editable).toBe(false);
    });

    // After loading completes, the field should be enabled again
    await waitFor(() => {
      expect(getByPlaceholderText('Nome').props.editable).toBe(true);
    }, { timeout: 200 });
  });

  // Test 8: Test that save buttons are disabled during loading
  test('save buttons are disabled during loading', async () => {
    // Make the API call take longer
    updateNome.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          message: 'Nome updated successfully',
          user: { ...mockUser, nome: 'Updated Name' }
        });
      }, 100);
    }));

    const { getAllByText } = render(
      <NewEditProfileScreen navigation={mockNavigation as any} route={{} as any} />
    );

    // Find the save button for nome field
    const saveButtons = getAllByText('', { includeHiddenElements: true }).filter(
      node => node.props.accessibilityLabel === 'Botão para salvar nome'
    );
    
    // Click the save button
    fireEvent.press(saveButtons[0]);

    // Check if the button is disabled during loading
    await waitFor(() => {
      expect(saveButtons[0].props.disabled).toBe(true);
    });

    // After loading completes, the button should be enabled again
    await waitFor(() => {
      expect(saveButtons[0].props.disabled).toBe(false);
    }, { timeout: 200 });
  });
});