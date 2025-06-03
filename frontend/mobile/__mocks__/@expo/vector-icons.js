// Mock for @expo/vector-icons
const React = require('react');

// Create a simple mock component that renders nothing
const MockMaterialIcons = () => null;
MockMaterialIcons.displayName = 'MockMaterialIcons';

// Create simple mock components for other icon sets
const createMockIconComponent = (displayName) => {
  const MockComponent = () => null;
  MockComponent.displayName = displayName;
  return MockComponent;
};

// Export the mock components
module.exports = {
  MaterialIcons: MockMaterialIcons,
  Ionicons: createMockIconComponent('Ionicons'),
  FontAwesome: createMockIconComponent('FontAwesome'),
  FontAwesome5: createMockIconComponent('FontAwesome5'),
  AntDesign: createMockIconComponent('AntDesign'),
  Entypo: createMockIconComponent('Entypo'),
  Feather: createMockIconComponent('Feather'),
  MaterialCommunityIcons: createMockIconComponent('MaterialCommunityIcons'),
  Octicons: createMockIconComponent('Octicons'),
  SimpleLineIcons: createMockIconComponent('SimpleLineIcons'),
  Fontisto: createMockIconComponent('Fontisto'),
  EvilIcons: createMockIconComponent('EvilIcons'),
  Foundation: createMockIconComponent('Foundation'),
  Zocial: createMockIconComponent('Zocial'),
};
