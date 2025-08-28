import { connectDB } from '../connect-db';
import { assembleUserState } from '../utility';
import md5 from 'md5';
import uuid from 'uuid';

// Mock dependencies
jest.mock('../connect-db', () => ({
  connectDB: jest.fn()
}));

jest.mock('../utility', () => ({
  assembleUserState: jest.fn()
}));

jest.mock('md5', () => jest.fn());

jest.mock('uuid', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Import after mocking
import { authenticationRoute } from '../authenticate';

describe('Authentication Module', () => {
  let mockApp;
  let mockDb;
  let mockUsersCollection;
  let mockGroupsCollection;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock collections
    mockUsersCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn()
    };

    mockGroupsCollection = {
      insertOne: jest.fn()
    };

    // Setup mock database
    mockDb = {
      collection: jest.fn((name) => {
        switch (name) {
          case 'users':
            return mockUsersCollection;
          case 'groups':
            return mockGroupsCollection;
          default:
            return null;
        }
      })
    };

    // Setup mock Express app
    mockApp = {
      post: jest.fn()
    };

    // Setup mock request/response
    mockRequest = {
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    connectDB.mockResolvedValue(mockDb);
  });

  describe('authenticationRoute', () => {
    it('should register authentication routes', () => {
      authenticationRoute(mockApp);

      expect(mockApp.post).toHaveBeenCalledWith('/authenticate', expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/user/create', expect.any(Function));
    });
  });

  describe('/authenticate endpoint', () => {
    let authenticateHandler;

    beforeEach(() => {
      authenticationRoute(mockApp);
      authenticateHandler = mockApp.post.mock.calls.find(
        call => call[0] === '/authenticate'
      )[1];
    });

    it('should authenticate user with correct credentials', async () => {
      const user = {
        id: 'user-1',
        name: 'testuser',
        passwordHash: 'hashed-password'
      };

      const state = {
        session: { authenticated: 'AUTHENTICATED', id: 'user-1' },
        tasks: [],
        users: [],
        comments: [],
        groups: []
      };

      mockRequest.body = {
        username: 'testuser',
        password: 'password123'
      };

      mockUsersCollection.findOne.mockResolvedValue(user);
      md5.mockReturnValue('hashed-password');
      uuid.mockReturnValue('auth-token-123');
      assembleUserState.mockResolvedValue(state);

      await authenticateHandler(mockRequest, mockResponse);

      expect(mockUsersCollection.findOne).toHaveBeenCalledWith({ name: 'testuser' });
      expect(md5).toHaveBeenCalledWith('password123');
      expect(uuid).toHaveBeenCalled();
      expect(assembleUserState).toHaveBeenCalledWith(user);
      expect(mockResponse.send).toHaveBeenCalledWith({
        token: 'auth-token-123',
        state
      });
    });

    it('should return 500 when user not found', async () => {
      mockRequest.body = {
        username: 'nonexistent',
        password: 'password123'
      };

      mockUsersCollection.findOne.mockResolvedValue(null);

      await authenticateHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('User not found');
    });

    it('should return 500 when password is incorrect', async () => {
      const user = {
        id: 'user-1',
        name: 'testuser',
        passwordHash: 'correct-hash'
      };

      mockRequest.body = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      mockUsersCollection.findOne.mockResolvedValue(user);
      md5.mockReturnValue('wrong-hash');

      await authenticateHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Password incorrect');
    });

    it('should handle database connection errors', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123'
      };

      connectDB.mockRejectedValue(new Error('Database connection failed'));

      await authenticateHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle missing username or password', async () => {
      mockRequest.body = {
        username: 'testuser'
        // missing password
      };

      await authenticateHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('User not found');
    });
  });

  describe('/user/create endpoint', () => {
    let createUserHandler;

    beforeEach(() => {
      authenticationRoute(mockApp);
      createUserHandler = mockApp.post.mock.calls.find(
        call => call[0] === '/user/create'
      )[1];
    });

    it('should create new user successfully', async () => {
      const newUser = {
        id: 'user-123',
        name: 'newuser',
        passwordHash: 'hashed-password'
      };

      const state = {
        session: { authenticated: 'AUTHENTICATED', id: 'user-123' },
        tasks: [],
        users: [],
        comments: [],
        groups: []
      };

      mockRequest.body = {
        username: 'newuser',
        password: 'password123'
      };

      mockUsersCollection.findOne.mockResolvedValue(null); // User doesn't exist
      uuid.mockReturnValueOnce('user-123').mockReturnValueOnce('group-456');
      md5.mockReturnValue('hashed-password');
      assembleUserState.mockResolvedValue(state);

      await createUserHandler(mockRequest, mockResponse);

      expect(mockUsersCollection.findOne).toHaveBeenCalledWith({ name: 'newuser' });
      expect(mockUsersCollection.insertOne).toHaveBeenCalledWith({
        name: 'newuser',
        id: 'user-123',
        passwordHash: 'hashed-password'
      });
      expect(mockGroupsCollection.insertOne).toHaveBeenCalledWith({
        id: 'group-456',
        owner: 'user-123',
        name: 'To Do'
      });
      expect(assembleUserState).toHaveBeenCalledWith({
        id: 'user-123',
        name: 'newuser'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith({
        userID: 'user-123',
        state
      });
    });

    it('should return 500 when user already exists', async () => {
      const existingUser = {
        id: 'existing-user',
        name: 'existinguser',
        passwordHash: 'existing-hash'
      };

      mockRequest.body = {
        username: 'existinguser',
        password: 'password123'
      };

      mockUsersCollection.findOne.mockResolvedValue(existingUser);

      await createUserHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'A user with that account name already exists.'
      });
    });

    it('should handle database connection errors', async () => {
      mockRequest.body = {
        username: 'newuser',
        password: 'password123'
      };

      connectDB.mockRejectedValue(new Error('Database connection failed'));

      await createUserHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle user insertion errors', async () => {
      mockRequest.body = {
        username: 'newuser',
        password: 'password123'
      };

      mockUsersCollection.findOne.mockResolvedValue(null);
      mockUsersCollection.insertOne.mockRejectedValue(new Error('Insertion failed'));

      await createUserHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle group creation errors', async () => {
      mockRequest.body = {
        username: 'newuser',
        password: 'password123'
      };

      mockUsersCollection.findOne.mockResolvedValue(null);
      mockGroupsCollection.insertOne.mockRejectedValue(new Error('Group creation failed'));

      await createUserHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle missing username or password', async () => {
      mockRequest.body = {
        username: 'newuser'
        // missing password
      };

      await createUserHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should hash password correctly', async () => {
      mockRequest.body = {
        username: 'newuser',
        password: 'mypassword'
      };

      mockUsersCollection.findOne.mockResolvedValue(null);
      md5.mockReturnValue('hashed-mypassword');

      await createUserHandler(mockRequest, mockResponse);

      expect(md5).toHaveBeenCalledWith('mypassword');
      expect(mockUsersCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: 'hashed-mypassword'
        })
      );
    });

    it('should generate unique IDs for user and group', async () => {
      mockRequest.body = {
        username: 'newuser',
        password: 'password123'
      };

      mockUsersCollection.findOne.mockResolvedValue(null);
      uuid.mockReturnValueOnce('user-uuid-123').mockReturnValueOnce('group-uuid-456');

      await createUserHandler(mockRequest, mockResponse);

      expect(uuid).toHaveBeenCalledTimes(2);
      expect(mockUsersCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-uuid-123'
        })
      );
      expect(mockGroupsCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'group-uuid-456',
          owner: 'user-uuid-123'
        })
      );
    });
  });

  describe('Authentication Tokens', () => {
    it('should store authentication tokens', async () => {
      // This would require accessing the internal authenticationTokens array
      // For now, we'll test that tokens are generated and used
      const user = {
        id: 'user-1',
        name: 'testuser',
        passwordHash: 'hashed-password'
      };

      mockRequest.body = {
        username: 'testuser',
        password: 'password123'
      };

      mockUsersCollection.findOne.mockResolvedValue(user);
      md5.mockReturnValue('hashed-password');
      uuid.mockReturnValue('test-token-123');
      assembleUserState.mockResolvedValue({});

      authenticationRoute(mockApp);
      const authenticateHandler = mockApp.post.mock.calls.find(
        call => call[0] === '/authenticate'
      )[1];

      await authenticateHandler(mockRequest, mockResponse);

      expect(uuid).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'test-token-123'
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      mockRequest.body = {};

      authenticationRoute(mockApp);
      const authenticateHandler = mockApp.post.mock.calls.find(
        call => call[0] === '/authenticate'
      )[1];

      await authenticateHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle null request body', async () => {
      mockRequest.body = null;

      authenticationRoute(mockApp);
      const authenticateHandler = mockApp.post.mock.calls.find(
        call => call[0] === '/authenticate'
      )[1];

      await authenticateHandler(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Request body is null');
    });

    it('should handle special characters in username', async () => {
      mockRequest.body = {
        username: 'user@domain.com',
        password: 'password123'
      };

      mockUsersCollection.findOne.mockResolvedValue(null);

      authenticationRoute(mockApp);
      const createUserHandler = mockApp.post.mock.calls.find(
        call => call[0] === '/user/create'
      )[1];

      await createUserHandler(mockRequest, mockResponse);

      expect(mockUsersCollection.findOne).toHaveBeenCalledWith({ name: 'user@domain.com' });
    });
  });
});
