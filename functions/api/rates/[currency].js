import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase(uri, dbName) {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

export async function onRequestGet(context) {
    const { params, env } = context;
    const currency = params.currency?.toLowerCase();

    if (!currency) {
        return Response.json(
            { error: 'Currency parameter is required' },
            { status: 400 }
        );
    }

    const mongoUri = env.MONGO_URI;
    const dbName = env.DB_NAME;
    const collectionPrefix = env.COLLECTION_PREFIX || 'daily_';

    if (!mongoUri || !dbName) {
        console.error('Missing required environment variables (MONGO_URI, DB_NAME).');
        return Response.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }

    try {
        const { db } = await connectToDatabase(mongoUri, dbName);
        const collectionName = `${collectionPrefix}${currency}_rates`;
        console.log(`Fetching data from collection: ${collectionName}`);

        const collection = db.collection(collectionName);
        const data = await collection.find({}).toArray();

        if (data.length === 0) {
            console.warn(`No data found for currency: ${currency} in collection: ${collectionName}`);
        }

        return Response.json(data);
    } catch (error) {
        console.error('Error during API request:', error);
        return Response.json(
            { error: 'Error fetching data from the database.' },
            { status: 500 }
        );
    }
}
