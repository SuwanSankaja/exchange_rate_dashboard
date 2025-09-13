const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
// The PORT variable is no longer needed in a serverless environment
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const collectionPrefix = process.env.COLLECTION_PREFIX || 'daily_';

// Validate essential environment variables
if (!uri || !dbName) {
    console.error("Fatal: Missing required environment variables (MONGO_URI, DB_NAME).");
    // In a serverless function, throwing an error is better than process.exit
    throw new Error("Missing required environment variables.");
}

const client = new MongoClient(uri);
let db;

// Establishes a connection to the database
async function connectToDatabase() {
    if (db && client.topology && client.topology.isConnected()) {
        return; // Return if connection is already established
    }
    try {
        await client.connect();
        db = client.db(dbName);
        console.log("Successfully connected to MongoDB.");
    } catch (error) {
        console.error("Could not connect to MongoDB.", error);
        // Throw error to be caught by the API handler
        throw new Error("Could not connect to the database.");
    }
}

// --- Middleware ---
app.use(cors());

// --- API Endpoint ---
app.get('/api/rates/:currency', async (req, res) => {
    try {
        await connectToDatabase();
        
        const currency = req.params.currency.toLowerCase();
        const collectionName = `${collectionPrefix}${currency}_rates`;
        console.log(`Fetching data from collection: ${collectionName}`);

        const collection = db.collection(collectionName);
        const data = await collection.find({}).toArray();

        if (data.length === 0) {
            console.warn(`No data found for currency: ${currency} in collection: ${collectionName}`);
        }
        
        res.json(data);
    } catch (e) {
        console.error("Error during API request:", e);
        res.status(500).send("Error fetching data from the database.");
    }
});

// Export the app for Vercel to use
module.exports = app;

