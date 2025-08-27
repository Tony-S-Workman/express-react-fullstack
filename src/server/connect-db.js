import { MongoClient } from 'mongodb';
import config from './config';

const url = config.MONGODB_URI;
let db = null;

export async function connectDB(){
    if (db) return db;
    let client = await MongoClient.connect(url, { useNewUrlParser: true });
    db = client.db();
    return db;
}