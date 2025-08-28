import { MongoClient } from 'mongodb';
import config from './config';

export async function connectDB(mongoUri = config.MONGODB_URI) {
    if (typeof mongoUri !== 'string' || !mongoUri.startsWith('mongodb')) {
        throw new Error('Invalid MongoDB connection string.');
    }
    try {
        const client = await MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        return client.db();
    } catch (error) {
        throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
}