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

  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 15000,
  });
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

    // Only fetch last 400 days and project only needed fields to reduce payload
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 400);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    const data = await collection
      .find(
        { date: { $gte: cutoffStr } },
        {
          projection: {
            _id: 0,
            date: 1,
            bank_rates: 1,
            market_statistics: 1,
            last_updated: 1,
            data_completeness: 1,
          },
        }
      )
      .sort({ date: 1 })
      .toArray();

    if (data.length === 0) {
      // Fallback: try without date filter (in case dates are stored differently)
      const allData = await collection
        .find(
          {},
          {
            projection: {
              _id: 0,
              date: 1,
              bank_rates: 1,
              market_statistics: 1,
              last_updated: 1,
              data_completeness: 1,
            },
          }
        )
        .sort({ date: 1 })
        .limit(400)
        .toArray();

      return NextResponse.json(allData);
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
