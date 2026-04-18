import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const collectionPrefix = process.env.COLLECTION_PREFIX || "daily_";
const supportedCurrencies = new Set(["usd", "aud", "eur", "gbp"]);
const API_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedClient: MongoClient | null = null;
let cachedClientPromise: Promise<MongoClient> | null = null;

type RatesResponse = Awaited<ReturnType<typeof getRatesForCurrency>>;

interface RatesCacheEntry {
  data: RatesResponse;
  expiresAt: number;
}

const responseCache = new Map<string, RatesCacheEntry>();

async function getClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  if (!uri) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  if (!cachedClientPromise) {
    cachedClientPromise = (async () => {
      const client = new MongoClient(uri, {
        connectTimeoutMS: 8000,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 12000,
        maxPoolSize: 1,
      });

      await client.connect();
      cachedClient = client;
      return client;
    })().catch((error) => {
      cachedClientPromise = null;
      throw error;
    });
  }

  return cachedClientPromise;
}

// Cache duration: 10 minutes at CDN edge, 5 minutes in browser
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=600, max-age=300, stale-while-revalidate=60",
};

function getCachedRates(currency: string): RatesResponse | null {
  const cachedEntry = responseCache.get(currency);
  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    responseCache.delete(currency);
    return null;
  }

  return cachedEntry.data;
}

function setCachedRates(currency: string, data: RatesResponse) {
  responseCache.set(currency, {
    data,
    expiresAt: Date.now() + API_CACHE_TTL_MS,
  });
}

async function getRatesForCurrency(currency: string) {
  const collectionName = `${collectionPrefix}${currency}_rates`;
  const client = await getClient();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  // Only fetch the last 400 days and project only the fields the UI uses.
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 400);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  let data = await collection
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
    data = await collection
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
  }

  return data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ currency: string }> }
) {
  try {
    const { currency } = await params;
    const currencyLower = currency.toLowerCase();

    if (!dbName) {
      return NextResponse.json(
        { error: "Missing DB_NAME environment variable" },
        { status: 500 }
      );
    }

    if (!supportedCurrencies.has(currencyLower)) {
      return NextResponse.json(
        { error: `Unsupported currency: ${currency}.` },
        { status: 400 }
      );
    }

    const cachedRates = getCachedRates(currencyLower);
    if (cachedRates) {
      return NextResponse.json(cachedRates, { headers: CACHE_HEADERS });
    }

    const data = await getRatesForCurrency(currencyLower);
    setCachedRates(currencyLower, data);

    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch (e) {
    cachedClient = null;
    cachedClientPromise = null;
    console.error("Error during API request:", e);
    return NextResponse.json(
      { error: "Error fetching data from the database." },
      { status: 500 }
    );
  }
}
