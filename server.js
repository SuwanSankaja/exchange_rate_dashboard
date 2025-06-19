const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path'); // Import the 'path' module
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

if (!uri || !dbName || !collectionName) {
    console.error("Fatal: Missing required environment variables (MONGO_URI, DB_NAME, COLLECTION_NAME).");
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
// Enable CORS for API requests
app.use(cors()); 

// Serve static files (like index.html) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoint ---
app.get('/api/rates', async (req, res) => {
    if (!db) {
        return res.status(503).send("Service Unavailable: Database connection not ready.");
    }
    
    try {
        const collection = db.collection(collectionName);
        const data = await collection.find({}).toArray();
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