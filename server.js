const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
// We now use a prefix to dynamically build the collection name
const collectionPrefix = process.env.COLLECTION_PREFIX || 'daily_'; 

if (!uri || !dbName) {
    console.error("Fatal: Missing required environment variables (MONGO_URI, DB_NAME).");
    process.exit(1);
}

const client = new MongoClient(uri);
let db;

async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db(dbName);
        console.log("Successfully connected to MongoDB and database is ready.");
    } catch (error) {
        console.error("Fatal: Could not connect to MongoDB.", error);
        process.exit(1);
    }
}

// --- Middleware ---
app.use(cors()); 
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoint ---
// The endpoint now accepts a currency parameter, e.g., /api/rates/usd
app.get('/api/rates/:currency', async (req, res) => {
    if (!db) {
        return res.status(503).send("Service Unavailable: Database connection not ready.");
    }
    
    try {
        // Dynamically create the collection name based on the currency parameter
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
        console.error("Error fetching data from MongoDB:", e);
        res.status(500).send("Error fetching data from the database.");
    }
});

// --- Start Server ---
connectToDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});