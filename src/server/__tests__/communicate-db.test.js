import { connectDB } from '../connect-db';

// Mock connectDB
jest.mock('../connect-db', () => ({
  connectDB: jest.fn()
}));

// Import after mocking
import { addNewTask, updateTask } from '../communicate-db';

describe('Database Communication Module', () => {
  let mockDb;
  let mockCollection;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock collection
    mockCollection = {
      insertOne: jest.fn(),
      updateOne: jest.fn()
    };

    // Setup mock database
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    connectDB.mockResolvedValue(mockDb);
  });

  describe('addNewTask', () => {
    it('should insert a new task into the database', async () => {
      const task = {
        id: 'task-1',
        name: 'Test Task',
        isComplete: false,
        owner: 'user-1'
      };

      await addNewTask(task);

      expect(connectDB).toHaveBeenCalled();
      expect(mockDb.collection).toHaveBeenCalledWith('tasks');
      expect(mockCollection.insertOne).toHaveBeenCalledWith(task);
    });

    it('should handle task with minimal properties', async () => {
      const task = {
        name: 'Simple Task'
      };

      await addNewTask(task);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(task);
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      connectDB.mockRejectedValue(error);

      const task = { name: 'Test Task' };

      await expect(addNewTask(task)).rejects.toThrow('Database connection failed');
    });

    it('should handle insertion errors', async () => {
      const error = new Error('Insertion failed');
      mockCollection.insertOne.mockRejectedValue(error);

      const task = { name: 'Test Task' };

      await expect(addNewTask(task)).rejects.toThrow('Insertion failed');
    });
  });

  describe('updateTask', () => {
    it('should update task name when provided', async () => {
      const task = {
        id: 'task-1',
        name: 'Updated Task Name'
      };

      await updateTask(task);

      expect(mockDb.collection).toHaveBeenCalledWith('tasks');
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { name: 'Updated Task Name' } }
      );
    });

    it('should update task completion status when provided', async () => {
      const task = {
        id: 'task-1',
        isComplete: true
      };

      await updateTask(task);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { isComplete: true } }
      );
    });

    it('should update task group when provided', async () => {
      const task = {
        id: 'task-1',
        group: 'new-group'
      };

      await updateTask(task);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { group: 'new-group' } }
      );
    });

    it('should update multiple properties when provided', async () => {
      const task = {
        id: 'task-1',
        name: 'Updated Name',
        isComplete: true,
        group: 'new-group'
      };

      await updateTask(task);

      expect(mockCollection.updateOne).toHaveBeenCalledTimes(3);
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { group: 'new-group' } }
      );
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { name: 'Updated Name' } }
      );
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { isComplete: true } }
      );
    });

    it('should handle isComplete as false', async () => {
      const task = {
        id: 'task-1',
        isComplete: false
      };

      await updateTask(task);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { isComplete: false } }
      );
    });

    it('should not update properties that are undefined', async () => {
      const task = {
        id: 'task-1',
        name: 'Test Task',
        isComplete: undefined,
        group: undefined
      };

      await updateTask(task);

      expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { name: 'Test Task' } }
      );
    });

    it('should handle task with only id', async () => {
      const task = {
        id: 'task-1'
      };

      await updateTask(task);

      expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      connectDB.mockRejectedValue(error);

      const task = { id: 'task-1', name: 'Test' };

      await expect(updateTask(task)).rejects.toThrow('Database connection failed');
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockCollection.updateOne.mockRejectedValue(error);

      const task = { id: 'task-1', name: 'Test' };

      await expect(updateTask(task)).rejects.toThrow('Update failed');
    });

    it('should handle missing id', async () => {
      const task = {
        name: 'Task without ID'
      };

      await updateTask(task);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: undefined },
        { $set: { name: 'Task without ID' } }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty task object for addNewTask', async () => {
      await addNewTask({});

      expect(mockCollection.insertOne).toHaveBeenCalledWith({});
    });

    it('should handle null values in task updates', async () => {
      const task = {
        id: 'task-1',
        name: null,
        isComplete: null
      };

      await updateTask(task);

      expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { name: null } }
      );
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { isComplete: null } }
      );
    });

    it('should handle special characters in task names', async () => {
      const task = {
        id: 'task-1',
        name: 'Task with special chars: !@#$%^&*()'
      };

      await updateTask(task);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'task-1' },
        { $set: { name: 'Task with special chars: !@#$%^&*()' } }
      );
    });
  });
});
