import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterEach, afterAll } from '@jest/globals';

// Global variable to store the MongoDB memory server instance
let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  // Create a new MongoDB memory server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Set the MongoDB URI environment variable
  process.env.MONGODB_URI = uri;

  // Connect to the in-memory database
  await mongoose.connect(uri);
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Clean up after all tests
afterAll(async () => {
  // Disconnect from the database
  await mongoose.disconnect();

  // Stop the MongoDB memory server
  await mongoServer.stop();
});
