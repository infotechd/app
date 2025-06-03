import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// A simple component to test
const SimpleComponent = () => (
  <View>
    <Text>Hello, World!</Text>
  </View>
);

describe('Simple Component Test', () => {
  test('renders correctly', () => {
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('Hello, World!')).toBeTruthy();
  });
});