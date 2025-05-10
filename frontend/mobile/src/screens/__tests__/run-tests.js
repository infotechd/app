// Script to run the LoginScreen tests

console.log('Running LoginScreen tests...');

// Import the test runner
const { run } = require('jest');

// Run the tests
run(['LoginScreen.test.tsx', 'LoginScreen.integration.test.tsx']);

console.log('Tests completed.');