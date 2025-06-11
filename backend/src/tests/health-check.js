// Simple script to check if the server is running
const axios = require('axios');
const baseURL = 'http://localhost:3000/api';

async function checkServerHealth() {
  try {
    console.log('Checking server health...');
    const response = await axios.get(`${baseURL}/health`);
    console.log('Server is running!');
    console.log('Health check response:', response.data);
    return true;
  } catch (error) {
    console.error('Server health check failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Server might not be running.');
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

// Run the health check
checkServerHealth().then(isRunning => {
  if (!isRunning) {
    console.log('Please make sure the server is running on http://localhost:3000');
    console.log('You can start the server with: npm start');
  }
});