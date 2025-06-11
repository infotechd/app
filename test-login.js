// Test script to verify login functionality and save token for other tests
const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');

// Load existing .env file if it exists
dotenv.config();

// Function to test login and save token
async function testLogin() {
  try {
    console.log('Testing login functionality...');

    // Use environment variables for credentials if available, otherwise use defaults
    // You should set these in your .env file or replace with actual credentials
    const loginData = {
      email: process.env.TEST_EMAIL || 'usuario@teste.com',
      senha: process.env.TEST_PASSWORD || 'Senha@123'
    };

    console.log(`Attempting login with email: ${loginData.email}`);
    // Don't log the password for security reasons

    // Use environment variable for API URL if available, otherwise use default
    const API_URL = process.env.API_URL || 'http://localhost:3000/api';
    console.log(`Using API URL: ${API_URL}`);

    // Make login request to the API
    const response = await axios.post(`${API_URL}/auth/login`, loginData);

    console.log('Login response status:', response.status);

    // Check if the response contains a user object and token
    if (response.data && response.data.user && response.data.token) {
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

      // Save token to .env file for use in other tests
      const token = response.data.token;

      // Read existing .env file content or create empty string if it doesn't exist
      let envContent = '';
      try {
        if (fs.existsSync('.env')) {
          envContent = fs.readFileSync('.env', 'utf8');
        }
      } catch (err) {
        console.error('Error reading .env file:', err);
      }

      // Check if AUTH_TOKEN already exists in .env
      if (envContent.includes('AUTH_TOKEN=')) {
        // Replace existing AUTH_TOKEN
        envContent = envContent.replace(/AUTH_TOKEN=.*(\r?\n|$)/g, `AUTH_TOKEN=${token}$1`);
      } else {
        // Add AUTH_TOKEN to .env
        envContent += `\nAUTH_TOKEN=${token}\n`;
      }

      // Write updated content back to .env
      try {
        fs.writeFileSync('.env', envContent);
        console.log('Token saved to .env file as AUTH_TOKEN');
      } catch (err) {
        console.error('Error writing to .env file:', err);
      }
    } else {
      console.error('Login failed: User data or token not found in response');
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
