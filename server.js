const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const collectionPrefix = process.env.COLLECTION_PREFIX || 'daily_';

// Validate essential environment variables
if (!uri || !dbName) {
    console.error("Fatal: Missing required environment variables (MONGO_URI, DB_NAME).");
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
        throw new Error("Could not connect to the database.");
    }
}

// --- Middleware ---
app.use(cors());

// Serve static files from the public directory
app.use(express.static('public'));

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

// Health check endpoint (optional but useful)
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// For local development only
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export the app for Vercel to use
module.exports = app;