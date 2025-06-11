// Simple test script to verify authentication functionality
const axios = require('axios');
const baseURL = 'http://localhost:3000/api';

// Test user data
const testUser = {
  nome: 'Test User',
  email: `test${Date.now()}@example.com`,
  senha: 'Test@123456',
  cpfCnpj: '52998224725', // Valid CPF that passes the validation algorithm
  telefone: '11987654321',
  isComprador: true
};

// Function to test user registration
async function testRegister() {
  try {
    console.log('Testing user registration...');
    console.log('Registration data:', JSON.stringify(testUser, null, 2));
    const response = await axios.post(`${baseURL}/auth/register`, testUser);
    console.log('Registration successful:', response.data);
    return true;
  } catch (error) {
    console.error('Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('No response received. Server might not be running.');
      console.error('Request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Error config:', JSON.stringify(error.config, null, 2));
    return false;
  }
}

// Function to test user login
async function testLogin() {
  try {
    console.log('Testing user login...');
    const response = await axios.post(`${baseURL}/auth/login`, {
      email: testUser.email,
      senha: testUser.senha
    });
    console.log('Login successful');
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to test profile retrieval
async function testGetProfile(token) {
  try {
    console.log('Testing profile retrieval...');
    const response = await axios.get(`${baseURL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Profile retrieved successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Profile retrieval failed:', error.response?.data || error.message);
    return false;
  }
}

// Function to test profile update
async function testUpdateProfile(token) {
  try {
    console.log('Testing profile update...');
    const response = await axios.put(
      `${baseURL}/auth/profile`,
      {
        user: {
          nome: 'Updated Test User',
          telefone: '11987654322'
        }
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('Profile updated successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Profile update failed:', error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('Starting authentication tests...');

  // Test registration
  const registerSuccess = await testRegister();
  if (!registerSuccess) {
    console.error('Tests aborted due to registration failure');
    return;
  }

  // Test login
  const token = await testLogin();
  if (!token) {
    console.error('Tests aborted due to login failure');
    return;
  }

  // Test profile retrieval
  const profileSuccess = await testGetProfile(token);
  if (!profileSuccess) {
    console.error('Tests aborted due to profile retrieval failure');
    return;
  }

  // Test profile update
  const updateSuccess = await testUpdateProfile(token);
  if (!updateSuccess) {
    console.error('Tests aborted due to profile update failure');
    return;
  }

  console.log('All authentication tests passed successfully!');
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error during tests:', error);
});
