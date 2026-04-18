import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const collectionPrefix = process.env.COLLECTION_PREFIX || "daily_";

let cachedClient: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (cachedClient) {
    try {
      await cachedClient.db("admin").command({ ping: 1 });
      return cachedClient;
    } catch {
      try {
        await cachedClient.close();
      } catch {
        /* ignore */
      }
      cachedClient = null;
    }
  }

  if (!uri) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ currency: string }> }
) {
  try {
    const { currency } = await params;
    const currencyLower = currency.toLowerCase();
    const collectionName = `${collectionPrefix}${currencyLower}_rates`;

    if (!dbName) {
      return NextResponse.json(
        { error: "Missing DB_NAME environment variable" },
        { status: 500 }
      );
    }

    const client = await getClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const data = await collection.find({}).toArray();

    if (data.length === 0) {
      console.warn(
        `No data found for currency: ${currencyLower} in collection: ${collectionName}`
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    cachedClient = null;
    console.error("Error during API request:", e);
    return NextResponse.json(
      { error: "Error fetching data from the database." },
      { status: 500 }
    );
  }
}
