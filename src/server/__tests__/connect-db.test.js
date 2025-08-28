import { MongoClient } from 'mongodb';

// Mock MongoDB
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn()
  }
}));

// Mock config
jest.mock('../config', () => ({
  MONGODB_URI: 'mongodb://test:27017/testdb'
}));

// Import after mocking
import { connectDB } from '../connect-db';

describe('Database Connection Module', () => {
  let mockClient;
  let mockDb;
  let mockCollection;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Setup mock database objects
    mockCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      toArray: jest.fn()
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
      db: jest.fn()
    };

    mockClient = {
      db: jest.fn().mockReturnValue(mockDb)
    };

    MongoClient.connect.mockResolvedValue(mockClient);
  });

  describe('connectDB', () => {
    it('should connect to MongoDB with correct URI', async () => {
      await connectDB();

      expect(MongoClient.connect).toHaveBeenCalledWith(
        'mongodb://test:27017/testdb',
        { useNewUrlParser: true }
      );
    });

    it('should return database instance', async () => {
      const result = await connectDB();

      expect(result).toBe(mockDb);
    });

    it('should reuse existing connection on subsequent calls', async () => {
      // First call
      await connectDB();
      
      // Second call
      await connectDB();

      // Should only connect once
      expect(MongoClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      MongoClient.connect.mockRejectedValue(error);

      await expect(connectDB()).rejects.toThrow('Connection failed');
    });

    it('should use newUrlParser option', async () => {
      await connectDB();

      expect(MongoClient.connect).toHaveBeenCalledWith(
        expect.any(String),
        { useNewUrlParser: true }
      );
    });
  });

  describe('Database Operations', () => {
    beforeEach(async () => {
      await connectDB();
    });

    it('should be able to access collections', async () => {
      const db = await connectDB();
      db.collection('test-collection');

      expect(mockDb.collection).toHaveBeenCalledWith('test-collection');
    });

    it('should return collection instance', async () => {
      const db = await connectDB();
      const collection = db.collection('test-collection');

      expect(collection).toBe(mockCollection);
    });
  });

  describe('Connection State Management', () => {
    it('should maintain single connection instance', async () => {
      const db1 = await connectDB();
      const db2 = await connectDB();

      expect(db1).toBe(db2);
      expect(MongoClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid connection requests', async () => {
      const promises = [
        connectDB(),
        connectDB(),
        connectDB()
      ];

      await Promise.all(promises);

      expect(MongoClient.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Scenarios', () => {
    it('should propagate MongoDB connection errors', async () => {
      MongoClient.connect.mockRejectedValue(new Error('Network error'));

      await expect(connectDB()).rejects.toThrow('Network error');
    });

    it('should handle invalid connection strings', async () => {
      // Mock config with invalid URI
      jest.resetModules();
      jest.mock('../config', () => ({
        MONGODB_URI: 'invalid-uri'
      }));

      const { connectDB } = require('../connect-db');
      MongoClient.connect.mockRejectedValue(new Error('Invalid connection string'));

      await expect(connectDB()).rejects.toThrow('Invalid connection string');
    });
  });
});
