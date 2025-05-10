import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import OfertaServicoScreen from '../OfertaServicoScreen';
import { fetchMyOffers as apiFetchMyOffers, createOffer as apiCreateOffer } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Mock the dependencies
jest.mock('../../services/api', () => ({
  fetchMyOffers: jest.fn(),
  createOffer: jest.fn(),
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

// Mock route
const mockRoute = {
  params: {
    offerId: undefined,
    mode: undefined,
  },
};

describe('OfertaServicoScreen', () => {
  // Setup common test variables
  const mockUser = { 
    id: '123', 
    name: 'Test Provider', 
    email: 'provider@example.com',
    token: 'mock-jwt-token' 
  };
  
  const mockOffers = [
    {
      _id: '1',
      descricao: 'Serviço de Teste 1',
      preco: 100.0,
      status: 'draft',
      disponibilidade: 'Imediata',
    },
    {
      _id: '2',
      descricao: 'Serviço de Teste 2',
      preco: 150.0,
      status: 'ready',
      disponibilidade: 'Próxima semana',
    },
  ];
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    useAuth.mockReturnValue({
      user: mockUser,
    });
    
    apiFetchMyOffers.mockResolvedValue({ offers: mockOffers });
    apiCreateOffer.mockResolvedValue({ 
      success: true, 
      message: 'Oferta criada com sucesso!',
      offer: {
        _id: '3',
        descricao: 'Nova Oferta',
        preco: 200.0,
        status: 'draft',
        disponibilidade: 'Sob demanda',
      }
    });
  });
  
  test('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Check if the main elements are rendered
    expect(getByText('Criar Nova Oferta')).toBeTruthy();
    expect(getByPlaceholderText('Descrição detalhada do serviço')).toBeTruthy();
    expect(getByPlaceholderText('Ex: 150.00')).toBeTruthy();
    expect(getByPlaceholderText('Ex: Imediata, Agendar, Próx. semana')).toBeTruthy();
    expect(getByText('Rascunho (Draft)')).toBeTruthy();
    expect(getByText('Pronta (Ready)')).toBeTruthy();
    expect(getByText('Criar Oferta')).toBeTruthy();
    expect(getByText('Minhas Ofertas')).toBeTruthy();
  });
  
  test('fetches offers on component mount', async () => {
    render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the API fetchMyOffers function was called with the correct token
      expect(apiFetchMyOffers).toHaveBeenCalledWith(mockUser.token);
    });
  });
  
  test('shows error alert when submitting with empty fields', () => {
    const { getByText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Try to create an offer without filling the fields
    fireEvent.press(getByText('Criar Oferta'));
    
    // Check if the alert was shown with the correct message
    expect(Alert.alert).toHaveBeenCalledWith('Erro de Validação', 'Descrição, Preço e Disponibilidade são obrigatórios.');
    
    // Verify that the API createOffer function was not called
    expect(apiCreateOffer).not.toHaveBeenCalled();
  });
  
  test('shows error alert when submitting with invalid price', () => {
    const { getByText, getByPlaceholderText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Fill the form with invalid price
    fireEvent.changeText(getByPlaceholderText('Descrição detalhada do serviço'), 'Serviço de Teste');
    fireEvent.changeText(getByPlaceholderText('Ex: 150.00'), 'abc');
    fireEvent.changeText(getByPlaceholderText('Ex: Imediata, Agendar, Próx. semana'), 'Imediata');
    
    // Try to create an offer
    fireEvent.press(getByText('Criar Oferta'));
    
    // Check if the alert was shown with the correct message
    expect(Alert.alert).toHaveBeenCalledWith('Erro de Validação', 'Preço inválido.');
    
    // Verify that the API createOffer function was not called
    expect(apiCreateOffer).not.toHaveBeenCalled();
  });
  
  test('handles successful offer creation', async () => {
    const { getByText, getByPlaceholderText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Fill the form
    fireEvent.changeText(getByPlaceholderText('Descrição detalhada do serviço'), 'Nova Oferta');
    fireEvent.changeText(getByPlaceholderText('Ex: 150.00'), '200');
    fireEvent.changeText(getByPlaceholderText('Ex: Imediata, Agendar, Próx. semana'), 'Sob demanda');
    
    // Select status (draft is default)
    
    // Submit the form
    fireEvent.press(getByText('Criar Oferta'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the API createOffer function was called with the correct parameters
      expect(apiCreateOffer).toHaveBeenCalledWith(mockUser.token, {
        descricao: 'Nova Oferta',
        preco: 200,
        status: 'draft',
        disponibilidade: 'Sob demanda',
      });
      
      // Check if the success alert was shown
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Oferta criada com sucesso!');
      
      // Check if fetchMyOffers was called again to refresh the list
      expect(apiFetchMyOffers).toHaveBeenCalledTimes(2);
    });
  });
  
  test('handles offer creation error', async () => {
    // Setup API createOffer to reject with an error
    const errorMessage = 'Erro ao criar oferta';
    apiCreateOffer.mockRejectedValueOnce(new Error(errorMessage));
    
    const { getByText, getByPlaceholderText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Fill the form
    fireEvent.changeText(getByPlaceholderText('Descrição detalhada do serviço'), 'Nova Oferta');
    fireEvent.changeText(getByPlaceholderText('Ex: 150.00'), '200');
    fireEvent.changeText(getByPlaceholderText('Ex: Imediata, Agendar, Próx. semana'), 'Sob demanda');
    
    // Submit the form
    fireEvent.press(getByText('Criar Oferta'));
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the error alert was shown
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro ao Criar Oferta', 
        'Não foi possível criar a oferta no momento. Por favor, tente novamente mais tarde.'
      );
      
      // Check that fetchMyOffers was not called again
      expect(apiFetchMyOffers).toHaveBeenCalledTimes(1);
    });
  });
  
  test('disables inputs and button during offer creation', async () => {
    // Setup API createOffer to resolve after a delay
    apiCreateOffer.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({ 
        success: true, 
        message: 'Oferta criada com sucesso!' 
      }), 100);
    }));
    
    const { getByText, getByPlaceholderText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Get references to the inputs and button
    const descricaoInput = getByPlaceholderText('Descrição detalhada do serviço');
    const precoInput = getByPlaceholderText('Ex: 150.00');
    const disponibilidadeInput = getByPlaceholderText('Ex: Imediata, Agendar, Próx. semana');
    const createButton = getByText('Criar Oferta');
    
    // Fill the form
    fireEvent.changeText(descricaoInput, 'Nova Oferta');
    fireEvent.changeText(precoInput, '200');
    fireEvent.changeText(disponibilidadeInput, 'Sob demanda');
    
    // Submit the form
    fireEvent.press(createButton);
    
    // Check that the button text changes to "Criando..."
    expect(getByText('Criando...')).toBeTruthy();
    
    // Check that the inputs and button are disabled during creation
    expect(descricaoInput.props.editable).toBe(false);
    expect(precoInput.props.editable).toBe(false);
    expect(disponibilidadeInput.props.editable).toBe(false);
    expect(createButton.props.disabled).toBe(true);
    
    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the success alert was shown
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Oferta criada com sucesso!');
    });
  });
  
  test('renders offers list when data is loaded', async () => {
    const { findByText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the offers to be loaded and rendered
    const offer1 = await findByText('Serviço de Teste 1');
    const offer2 = await findByText('Serviço de Teste 2');
    
    // Check if the offers are rendered
    expect(offer1).toBeTruthy();
    expect(offer2).toBeTruthy();
  });
  
  test('renders empty list message when no offers are available', async () => {
    // Setup API fetchMyOffers to return empty array
    apiFetchMyOffers.mockResolvedValueOnce({ offers: [] });
    
    const { findByText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the empty list message to be rendered
    const emptyMessage = await findByText('Você ainda não criou nenhuma oferta.');
    
    // Check if the empty list message is rendered
    expect(emptyMessage).toBeTruthy();
  });
  
  test('renders error message when fetching offers fails', async () => {
    // Setup API fetchMyOffers to reject with an error
    const errorMessage = 'Erro ao buscar ofertas';
    apiFetchMyOffers.mockRejectedValueOnce(new Error(errorMessage));
    
    const { findByText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the error message to be rendered
    const retryButton = await findByText('Tentar Novamente');
    
    // Check if the retry button is rendered
    expect(retryButton).toBeTruthy();
  });
  
  test('refreshes offers list when retry button is pressed', async () => {
    // Setup API fetchMyOffers to reject once then resolve
    const errorMessage = 'Erro ao buscar ofertas';
    apiFetchMyOffers.mockRejectedValueOnce(new Error(errorMessage));
    
    const { findByText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the retry button to be rendered
    const retryButton = await findByText('Tentar Novamente');
    
    // Reset the mock to resolve on next call
    apiFetchMyOffers.mockResolvedValueOnce({ offers: mockOffers });
    
    // Press the retry button
    fireEvent.press(retryButton);
    
    // Wait for the offers to be loaded and rendered
    const offer1 = await findByText('Serviço de Teste 1');
    
    // Check if the offers are rendered after retry
    expect(offer1).toBeTruthy();
    expect(apiFetchMyOffers).toHaveBeenCalledTimes(2);
  });
  
  test('changes status when status button is pressed', () => {
    const { getByText } = render(
      <OfertaServicoScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Get the status buttons
    const draftButton = getByText('Rascunho (Draft)');
    const readyButton = getByText('Pronta (Ready)');
    
    // Check that draft is selected by default
    expect(draftButton.props.style).toContainEqual(
      expect.objectContaining({ backgroundColor: '#3498db' })
    );
    
    // Press the ready button
    fireEvent.press(readyButton);
    
    // Check that ready is now selected
    expect(readyButton.props.style).toContainEqual(
      expect.objectContaining({ backgroundColor: '#3498db' })
    );
    
    // Press the draft button again
    fireEvent.press(draftButton);
    
    // Check that draft is selected again
    expect(draftButton.props.style).toContainEqual(
      expect.objectContaining({ backgroundColor: '#3498db' })
    );
  });
});