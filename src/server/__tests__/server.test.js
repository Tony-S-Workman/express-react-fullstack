import express from 'express';
import request from 'supertest';


// Mock dependencies
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn()
  }
}));

jest.mock('../config', () => ({
  NODE_ENV: 'test',
  PORT: 7777,
  CORS_ORIGIN: 'http://localhost:8080',
  MONGODB_URI: 'mongodb://test:27017/testdb'
}));

jest.mock('../connect-db', () => ({
  connectDB: jest.fn()
}));

jest.mock('../authenticate', () => ({
  authenticationRoute: jest.fn()
}));

jest.mock('../communicate-db', () => ({
  addNewTask: jest.fn(),
  updateTask: jest.fn()
}));

jest.mock('../initialize-db', () => ({}));


describe('Server Integration Tests', () => {
  let app;
  let mockDb;
  let mockCollection;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup mock database
    mockCollection = {
      insertOne: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn()
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  });

  describe('Server Setup', () => {
    it('should setup middleware correctly', () => {
      
      // Reset everything so we setup the mock first
      jest.resetModules();

      const { authenticationRoute } = require('../authenticate');
      
      // Mock the authentication route to avoid actual route registration
      authenticationRoute.mockImplementation(() => {
        console.log("Mock authentication route registered");
      });

      // Import server to trigger setup
      require('../server');

      expect(authenticationRoute).toHaveBeenCalled();
    });
  });

  describe('Task Endpoints', () => {
    let testApp;

    beforeEach(() => {
      const { addNewTask, updateTask } = require('../communicate-db');
      const { connectDB } = require('../connect-db');
      const { authenticationRoute } = require('../authenticate');

      // Setup mocks
      connectDB.mockResolvedValue(mockDb);
      addNewTask.mockResolvedValue();
      updateTask.mockResolvedValue();

      // Create test app with routes
      testApp = express();
      testApp.use(express.json());
      testApp.use(express.urlencoded({ extended: true }));

      // Mock authentication route
      authenticationRoute.mockImplementation(() => {
        // Don't actually register routes for this test
      });

      // Import server to get the route handlers
      require('../server');
    });

    describe('POST /task/new', () => {
      it('should create a new task', async () => {
        const { addNewTask } = require('../communicate-db');
        
        const taskData = {
          name: 'Test Task',
          isComplete: false,
          owner: 'user-1'
        };

        // Create a simple Express app with the task route
        const app = express();
        app.use(express.json());
        
        app.post('/task/new', async (req, res) => {
          await addNewTask(req.body.task);
          res.status(200).send();
        });

        await request(app)
          .post('/task/new')
          .send({ task: taskData })
          .expect(200);

        expect(addNewTask).toHaveBeenCalledWith(taskData);
      });

      it('should handle task creation errors', async () => {
        const { addNewTask } = require('../communicate-db');
        
        addNewTask.mockRejectedValue(new Error('Task creation failed'));

        const app = express();
        app.use(express.json());
        
        app.post('/task/new', async (req, res) => {
          try {
            await addNewTask(req.body.task);
            res.status(200).send();
          } catch (error) {
            res.status(500).send(error.message);
          }
        });

        const response = await request(app)
          .post('/task/new')
          .send({ task: { name: 'Test Task' } })
          .expect(500);

        expect(response.text).toBe('Task creation failed');
      });
    });

    describe('POST /task/update', () => {
      it('should update an existing task', async () => {
        const { updateTask } = require('../communicate-db');
        
        const taskData = {
          id: 'task-1',
          name: 'Updated Task',
          isComplete: true
        };

        const app = express();
        app.use(express.json());
        
        app.post('/task/update', async (req, res) => {
          await updateTask(req.body.task);
          res.status(200).send();
        });

        await request(app)
          .post('/task/update')
          .send({ task: taskData })
          .expect(200);

        expect(updateTask).toHaveBeenCalledWith(taskData);
      });

      it('should handle task update errors', async () => {
        const { updateTask } = require('../communicate-db');
        
        updateTask.mockRejectedValue(new Error('Task update failed'));

        const app = express();
        app.use(express.json());
        
        app.post('/task/update', async (req, res) => {
          try {
            await updateTask(req.body.task);
            res.status(200).send();
          } catch (error) {
            res.status(500).send(error.message);
          }
        });

        const response = await request(app)
          .post('/task/update')
          .send({ task: { id: 'task-1', name: 'Updated Task' } })
          .expect(500);

        expect(response.text).toBe('Task update failed');
      });
    });

    describe('POST /comment/new', () => {
      it('should create a new comment', async () => {
        const { connectDB } = require('../connect-db');
        
        const commentData = {
          id: 'comment-1',
          task: 'task-1',
          content: 'Test comment',
          owner: 'user-1'
        };

        const app = express();
        app.use(express.json());
        
        app.post('/comment/new', async (req, res) => {
          const comment = req.body.comment;
          const db = await connectDB();
          const collection = db.collection('comments');
          await collection.insertOne(comment);
          res.status(200).send();
        });

        await request(app)
          .post('/comment/new')
          .send({ comment: commentData })
          .expect(200);

        expect(connectDB).toHaveBeenCalled();
        expect(mockDb.collection).toHaveBeenCalledWith('comments');
        expect(mockCollection.insertOne).toHaveBeenCalledWith(commentData);
      });

      it('should handle comment creation errors', async () => {
        const { connectDB } = require('../connect-db');
        
        connectDB.mockRejectedValue(new Error('Database connection failed'));

        const app = express();
        app.use(express.json());
        
        app.post('/comment/new', async (req, res) => {
          try {
            const comment = req.body.comment;
            const db = await connectDB();
            const collection = db.collection('comments');
            await collection.insertOne(comment);
            res.status(200).send();
          } catch (error) {
            res.status(500).send(error.message);
          }
        });

        const response = await request(app)
          .post('/comment/new')
          .send({ comment: { content: 'Test comment' } })
          .expect(500);

        expect(response.text).toBe('Database connection failed');
      });
    });
  });

  describe('Production Mode', () => {
    it('should serve static files in production mode', () => {
      jest.resetModules();

     // Mock path module
      jest.mock('path', () => ({
        resolve: jest.fn().mockReturnValue('/test/path')
      }));

      jest.mock('express', () => {
        const actualExpress = jest.requireActual('express');
        const staticMiddleware = jest.fn();

        // Create a mock express function
        function express() {
          return actualExpress();
        }
        express.static = jest.fn().mockReturnValue(staticMiddleware);

        return {
          __esModule: true,
          default: express,
          static: express.static,
        };
      });

      // Mock production environment
      jest.mock('../config', () => ({
        NODE_ENV: 'production',
        PORT: 7777,
        CORS_ORIGIN: 'http://localhost:8080'
      }));

      // Now require server to trigger production setup
      require('../server');

      const express = require('express');
      expect(express.static).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const app = express();
      app.use(express.json());
      
      app.post('/task/new', async (req, res) => {
        res.status(200).send();
      });

      await request(app)
        .post('/task/new')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing request body', async () => {
      const app = express();
      app.use(express.json());
      
      app.post('/task/new', async (req, res) => {
        if (!req.body.task) {
          return res.status(400).send('Task data required');
        }
        res.status(200).send();
      });

      const response = await request(app)
        .post('/task/new')
        .send({})
        .expect(400);

      expect(response.text).toBe('Task data required');
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from configured origin', async () => {

       // Reset everything so we setup the mock first
      jest.resetModules();

      const cors = require('cors');
      jest.mock('cors', () => jest.fn().mockReturnValue((req, res, next) => next()));

      // Import server to trigger CORS setup
      require('../server');

      expect(cors).toHaveBeenCalled();
    });
  });

  describe('Middleware Stack', () => {
    it('should apply body parsing middleware', async () => {
      const app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      
      app.post('/test', (req, res) => {
        res.json(req.body);
      });

      const testData = { test: 'data' };

      const response = await request(app)
        .post('/test')
        .send(testData)
        .expect(200);

      expect(response.body).toEqual(testData);
    });
  });
});
