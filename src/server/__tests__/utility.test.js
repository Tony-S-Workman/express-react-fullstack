import { connectDB } from '../connect-db';

// Mock connectDB
jest.mock('../connect-db', () => ({
  connectDB: jest.fn()
}));

// Import after mocking
import { assembleUserState } from '../utility';

describe('Utility Module', () => {
  let mockDb;
  let mockTasksCollection;
  let mockCommentsCollection;
  let mockUsersCollection;
  let mockGroupsCollection;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock collections
    mockTasksCollection = {
      find: jest.fn().mockReturnValue({
        toArray: jest.fn()
      })
    };

    mockCommentsCollection = {
      find: jest.fn().mockReturnValue({
        toArray: jest.fn()
      })
    };

    mockUsersCollection = {
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        toArray: jest.fn()
      })
    };

    mockGroupsCollection = {
      find: jest.fn().mockReturnValue({
        toArray: jest.fn()
      })
    };

    // Setup mock database
    mockDb = {
      collection: jest.fn((name) => {
        switch (name) {
          case 'tasks':
            return mockTasksCollection;
          case 'comments':
            return mockCommentsCollection;
          case 'users':
            return mockUsersCollection;
          case 'groups':
            return mockGroupsCollection;
          default:
            return null;
        }
      })
    };

    connectDB.mockResolvedValue(mockDb);
  });

  describe('assembleUserState', () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User'
    };

    const mockTasks = [
      { id: 'task-1', name: 'Task 1', owner: 'user-1' },
      { id: 'task-2', name: 'Task 2', owner: 'user-1' }
    ];

    const mockComments = [
      { id: 'comment-1', task: 'task-1', owner: 'user-2' },
      { id: 'comment-2', task: 'task-2', owner: 'user-1' }
    ];

    const mockUsers = [
      { id: 'user-1', name: 'Test User' },
      { id: 'user-2', name: 'Another User' }
    ];

    const mockGroups = [
      { id: 'group-1', name: 'Work', owner: 'user-1' },
      { id: 'group-2', name: 'Personal', owner: 'user-1' }
    ];

    beforeEach(() => {
      // Setup default mock responses
      mockTasksCollection.find().toArray.mockResolvedValue(mockTasks);
      mockCommentsCollection.find().toArray.mockResolvedValue(mockComments);
      mockUsersCollection.findOne.mockResolvedValue(mockUsers[0]);
      mockUsersCollection.find().toArray.mockResolvedValue(mockUsers);
      mockGroupsCollection.find().toArray.mockResolvedValue(mockGroups);
    });

    it('should assemble complete user state', async () => {
      const result = await assembleUserState(mockUser);

      expect(connectDB).toHaveBeenCalled();
      expect(result).toEqual({
        session: {
          authenticated: 'AUTHENTICATED',
          id: 'user-1'
        },
        groups: mockGroups,
        tasks: mockTasks,
        users: [mockUsers[0], mockUsers[0], mockUsers[1]], // User appears twice due to being in both tasks and comments
        comments: mockComments
      });
    });

    it('should query tasks for the correct user', async () => {
      await assembleUserState(mockUser);

      expect(mockTasksCollection.find).toHaveBeenCalledWith({ owner: 'user-1' });
    });

    it('should query comments for tasks owned by the user', async () => {
      await assembleUserState(mockUser);

      expect(mockCommentsCollection.find).toHaveBeenCalledWith({
        task: { $in: ['task-1', 'task-2'] }
      });
    });

    it('should query the user and related users', async () => {
      await assembleUserState(mockUser);

      expect(mockUsersCollection.findOne).toHaveBeenCalledWith({ id: 'user-1' });
      expect(mockUsersCollection.find).toHaveBeenCalledWith({
        id: { $in: ['user-1', 'user-1'] } // User IDs from tasks and comments
      });
    });

    it('should query groups for the user', async () => {
      await assembleUserState(mockUser);

      expect(mockGroupsCollection.find).toHaveBeenCalledWith({ owner: 'user-1' });
    });

    it('should handle empty tasks array', async () => {
      mockTasksCollection.find().toArray.mockResolvedValue([]);
      mockCommentsCollection.find().toArray.mockResolvedValue([]);
      mockUsersCollection.find().toArray.mockResolvedValue([mockUsers[0]]);

      const result = await assembleUserState(mockUser);

      expect(result.tasks).toEqual([]);
      expect(result.comments).toEqual([]);
      expect(result.users).toEqual([mockUsers[0], mockUsers[0]]); // User appears twice
    });

    it('should handle empty comments array', async () => {
      mockCommentsCollection.find().toArray.mockResolvedValue([]);
      mockUsersCollection.find().toArray.mockResolvedValue([mockUsers[0]]);

      const result = await assembleUserState(mockUser);

      expect(result.comments).toEqual([]);
      expect(result.users).toEqual([mockUsers[0], mockUsers[0]]); // User appears twice
    });

    it('should handle empty groups array', async () => {
      mockGroupsCollection.find().toArray.mockResolvedValue([]);

      const result = await assembleUserState(mockUser);

      expect(result.groups).toEqual([]);
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      connectDB.mockRejectedValue(error);

      await expect(assembleUserState(mockUser)).rejects.toThrow('Database connection failed');
    });

    it('should handle tasks query errors', async () => {
      const error = new Error('Tasks query failed');
      mockTasksCollection.find().toArray.mockRejectedValue(error);

      await expect(assembleUserState(mockUser)).rejects.toThrow('Tasks query failed');
    });

    it('should handle comments query errors', async () => {
      const error = new Error('Comments query failed');
      mockCommentsCollection.find().toArray.mockRejectedValue(error);

      await expect(assembleUserState(mockUser)).rejects.toThrow('Comments query failed');
    });

    it('should handle users query errors', async () => {
      const error = new Error('Users query failed');
      mockUsersCollection.findOne.mockRejectedValue(error);

      await expect(assembleUserState(mockUser)).rejects.toThrow('Users query failed');
    });

    it('should handle groups query errors', async () => {
      const error = new Error('Groups query failed');
      mockGroupsCollection.find().toArray.mockRejectedValue(error);

      await expect(assembleUserState(mockUser)).rejects.toThrow('Groups query failed');
    });

    it('should handle user with no tasks', async () => {
      mockTasksCollection.find().toArray.mockResolvedValue([]);
      mockCommentsCollection.find().toArray.mockResolvedValue([]);
      mockUsersCollection.find().toArray.mockResolvedValue([mockUsers[0]]);

      const result = await assembleUserState(mockUser);

      expect(result.tasks).toEqual([]);
      expect(result.comments).toEqual([]);
      expect(result.users).toEqual([mockUsers[0], mockUsers[0]]); // User appears twice
    });

    it('should handle user with tasks but no comments', async () => {
      mockCommentsCollection.find().toArray.mockResolvedValue([]);
      mockUsersCollection.find().toArray.mockResolvedValue([mockUsers[0]]);

      const result = await assembleUserState(mockUser);

      expect(result.tasks).toEqual(mockTasks);
      expect(result.comments).toEqual([]);
      expect(result.users).toEqual([mockUsers[0], mockUsers[0]]); // User appears twice
    });

    it('should handle user with no groups', async () => {
      mockGroupsCollection.find().toArray.mockResolvedValue([]);

      const result = await assembleUserState(mockUser);

      expect(result.groups).toEqual([]);
    });

    it('should handle user object with minimal properties', async () => {
      const minimalUser = { id: 'user-1' };

      await assembleUserState(minimalUser);

      expect(mockTasksCollection.find).toHaveBeenCalledWith({ owner: 'user-1' });
      expect(mockUsersCollection.findOne).toHaveBeenCalledWith({ id: 'user-1' });
      expect(mockGroupsCollection.find).toHaveBeenCalledWith({ owner: 'user-1' });
    });

    it('should handle tasks with different owners', async () => {
      const tasksWithDifferentOwners = [
        { id: 'task-1', name: 'Task 1', owner: 'user-1' },
        { id: 'task-2', name: 'Task 2', owner: 'user-2' }
      ];

      mockTasksCollection.find().toArray.mockResolvedValue(tasksWithDifferentOwners);

      await assembleUserState(mockUser);

      expect(mockCommentsCollection.find).toHaveBeenCalledWith({
        task: { $in: ['task-1', 'task-2'] }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user', async () => {
      await expect(assembleUserState(null)).rejects.toThrow();
    });

    it('should handle undefined user', async () => {
      await expect(assembleUserState(undefined)).rejects.toThrow();
    });

    it('should handle user without id', async () => {
      const userWithoutId = { name: 'Test User' };

      await expect(assembleUserState(userWithoutId)).rejects.toThrow('User and user.id are required');
    });

    it('should handle tasks with null or undefined properties', async () => {
      const tasksWithNullProps = [
        { id: 'task-1', name: null, owner: 'user-1' },
        { id: 'task-2', name: undefined, owner: 'user-1' }
      ];

      mockTasksCollection.find().toArray.mockResolvedValue(tasksWithNullProps);
      mockCommentsCollection.find().toArray.mockResolvedValue([]);
      mockUsersCollection.find().toArray.mockResolvedValue([]);

      await assembleUserState({ id: 'user-1' });

      expect(mockCommentsCollection.find).toHaveBeenCalledWith({
        task: { $in: ['task-1', 'task-2'] }
      });
    });
  });
});
