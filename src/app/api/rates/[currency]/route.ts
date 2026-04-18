import { NextResponse } from "next/server";

const DEFAULT_API_BASE_URL =
  "https://exchange-rate-api.suwan-sankaja.workers.dev";
const apiBaseUrl =
  process.env.EXCHANGE_RATE_API_BASE_URL || DEFAULT_API_BASE_URL;
const apiKey = process.env.EXCHANGE_RATE_API_KEY;
const supportedCurrencies = new Set(["usd", "aud", "eur", "gbp"]);
const historyLimit = 400;
const cacheTtlMs = 5 * 60 * 1000;

interface UpstreamBankRate {
  buying_rate?: number;
  selling_rate?: number;
  spread?: number;
  last_updated?: string;
}

interface UpstreamHistoryItem {
  date: string;
  last_updated?: string;
  currency?: string;
  total_banks?: number;
  bank_rates?: Record<string, UpstreamBankRate>;
}

interface SummaryStatistics {
  max?: number;
  min?: number;
  avg?: number;
  best_bank?: string;
}

interface DashboardHistoryItem {
  date: string;
  bank_rates?: Record<string, UpstreamBankRate>;
  market_statistics?: {
    people_selling?: SummaryStatistics;
    people_buying?: SummaryStatistics;
  };
  last_updated?: string;
  data_completeness?: {
    update_timestamp?: string;
    banks_count?: number;
    banks_updated?: string[];
  };
}

interface CacheEntry {
  data: DashboardHistoryItem[];
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=600, max-age=300, stale-while-revalidate=60",
};

function getCachedRates(currency: string) {
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

function setCachedRates(currency: string, data: DashboardHistoryItem[]) {
  responseCache.set(currency, {
    data,
    expiresAt: Date.now() + cacheTtlMs,
  });
}

function buildSummary(
  values: Array<{ bank: string; rate: number }>,
  comparator: "max" | "min"
): SummaryStatistics | undefined {
  if (values.length === 0) {
    return undefined;
  }

  const rates = values.map((entry) => entry.rate);
  const targetRate =
    comparator === "max" ? Math.max(...rates) : Math.min(...rates);
  const targetEntry = values.find((entry) => entry.rate === targetRate);

  return {
    max: Math.max(...rates),
    min: Math.min(...rates),
    avg: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
    best_bank: targetEntry?.bank,
  };
}

function computeMarketStatistics(bankRates: Record<string, UpstreamBankRate>) {
  const buyingRates: Array<{ bank: string; rate: number }> = [];
  const sellingRates: Array<{ bank: string; rate: number }> = [];

  for (const [bank, rates] of Object.entries(bankRates)) {
    if (typeof rates.buying_rate === "number") {
      buyingRates.push({ bank, rate: rates.buying_rate });
    }

    if (typeof rates.selling_rate === "number") {
      sellingRates.push({ bank, rate: rates.selling_rate });
    }
  }

  return {
    people_selling: buildSummary(buyingRates, "max"),
    people_buying: buildSummary(sellingRates, "min"),
  };
}

function normalizeHistoryItem(item: UpstreamHistoryItem): DashboardHistoryItem {
  const bankRates = item.bank_rates || {};
  const bankNames = Object.keys(bankRates);

  return {
    date: item.date,
    bank_rates: bankRates,
    market_statistics: computeMarketStatistics(bankRates),
    last_updated: item.last_updated,
    data_completeness: {
      update_timestamp: item.last_updated,
      banks_count: item.total_banks ?? bankNames.length,
      banks_updated: bankNames,
    },
  };
}

async function fetchRatesForCurrency(currency: string) {
  if (!apiKey) {
    throw new Error("Missing EXCHANGE_RATE_API_KEY environment variable");
  }

  const url = new URL(`${apiBaseUrl}/v1/rates/${currency}/history`);
  url.searchParams.set("limit", String(historyLimit));

  const response = await fetch(url.toString(), {
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const upstreamMessage =
      payload && typeof payload.error === "string"
        ? payload.error
        : `Upstream API responded with ${response.status}.`;

    return NextResponse.json(
      { error: upstreamMessage },
      { status: response.status, headers: CACHE_HEADERS }
    );
  }

  if (!payload || !Array.isArray(payload.data)) {
    throw new Error("Exchange Rate API returned an unexpected response shape");
  }

  const normalizedData = payload.data
    .map((item: UpstreamHistoryItem) => normalizeHistoryItem(item))
    .sort((a: DashboardHistoryItem, b: DashboardHistoryItem) =>
      a.date.localeCompare(b.date)
    );

  setCachedRates(currency, normalizedData);
  return NextResponse.json(normalizedData, { headers: CACHE_HEADERS });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ currency: string }> }
) {
  try {
    const { currency } = await params;
    const currencyLower = currency.toLowerCase();

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

    return await fetchRatesForCurrency(currencyLower);
  } catch (error) {
    console.error("Error while proxying exchange rate API:", error);
    return NextResponse.json(
      { error: "Error fetching data from the exchange rate API." },
      { status: 502 }
    );
  }
}
