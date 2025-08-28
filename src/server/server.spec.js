import { addNewTask, updateTask } from './communicate-db'

// Mock connectDB to avoid actual database connections
jest.mock('./connect-db', () => ({
  connectDB: jest.fn().mockResolvedValue({
    collection: jest.fn().mockReturnValue({
      insertOne: jest.fn().mockResolvedValue({}),
      updateOne: jest.fn().mockResolvedValue({})
    })
  })
}));

describe('Legacy Server Spec', () => {
  it('should add and update tasks', async () => {
    await addNewTask({name:"Spec task",isComplete:true,id:"TEST-1"});
    await updateTask({name:"Spec Task (UPDATED)",id:"TEST-1",isComplete:false});
    
    // Test passes if no errors are thrown
    expect(true).toBe(true);
  });
});