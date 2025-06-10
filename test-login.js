// Test script to verify login functionality
const axios = require('axios');

// Function to test login
async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // Replace with actual test credentials
    const loginData = {
      email: 'test@example.com',
      senha: 'TestPassword123'
    };
    
    // Make login request to the API
    const response = await axios.post('http://localhost:3000/api/auth/login', loginData);
    
    console.log('Login response status:', response.status);
    
    // Check if the response contains a user object
    if (response.data && response.data.user) {
      console.log('Login successful!');
      console.log('User data received:');
      console.log('- ID:', response.data.user.id || response.data.user.idUsuario);
      console.log('- Name:', response.data.user.nome);
      console.log('- Email:', response.data.user.email);
      console.log('- isComprador:', response.data.user.isComprador);
      console.log('- isPrestador:', response.data.user.isPrestador);
      console.log('- isAnunciante:', response.data.user.isAnunciante);
      console.log('- isAdmin:', response.data.user.isAdmin);
      console.log('- Token present:', !!response.data.token);
    } else {
      console.error('Login failed: User data not found in response');
      console.log('Response data:', response.data);
    }
  } catch (error) {
    console.error('Error testing login:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testLogin();