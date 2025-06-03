import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RoleSection from '../RoleSection';

describe('RoleSection Component', () => {
  // Mock props
  const mockProps = {
    role: 'comprador' as const,
    isActive: false,
    isLoading: false,
    stats: [
      { label: 'Pendentes', value: 3 },
      { label: 'Concluídas', value: 12 },
      { label: 'Avaliações', value: 8 }
    ],
    actionButtons: [
      { text: 'Buscar Serviços', onPress: jest.fn() },
      { text: 'Ver Treinamentos', onPress: jest.fn() }
    ],
    onToggle: jest.fn(),
    testID: 'test-role-section'
  };

  it('renders correctly when collapsed', () => {
    const { getByTestId, queryByText } = render(<RoleSection {...mockProps} />);
    
    // Component should be rendered
    const component = getByTestId('test-role-section');
    expect(component).toBeTruthy();
    
    // Title should be visible
    expect(getByTestId('test-role-section')).toHaveTextContent('Comprador');
    
    // Content should not be visible when collapsed
    expect(queryByText('3')).toBeNull();
    expect(queryByText('Pendentes')).toBeNull();
  });

  it('renders content when expanded', () => {
    const { getByText, getAllByRole } = render(
      <RoleSection {...mockProps} isActive={true} />
    );
    
    // Stats should be visible
    expect(getByText('3')).toBeTruthy();
    expect(getByText('Pendentes')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('Concluídas')).toBeTruthy();
    
    // Action buttons should be visible
    const buttons = getAllByRole('button');
    expect(buttons.length).toBe(2);
    expect(getByText('Buscar Serviços')).toBeTruthy();
    expect(getByText('Ver Treinamentos')).toBeTruthy();
  });

  it('shows loading indicator when isLoading is true', () => {
    const { getByLabelText } = render(
      <RoleSection {...mockProps} isActive={true} isLoading={true} />
    );
    
    // Loading indicator should be visible
    expect(getByLabelText('Carregando dados')).toBeTruthy();
  });

  it('calls onToggle when header is pressed', () => {
    const { getByText } = render(<RoleSection {...mockProps} />);
    
    // Press the header
    fireEvent.press(getByText('Comprador'));
    
    // onToggle should be called
    expect(mockProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls action button onPress when button is pressed', () => {
    const { getByText } = render(
      <RoleSection {...mockProps} isActive={true} />
    );
    
    // Press the first action button
    fireEvent.press(getByText('Buscar Serviços'));
    
    // Button onPress should be called
    expect(mockProps.actionButtons[0].onPress).toHaveBeenCalledTimes(1);
  });
});