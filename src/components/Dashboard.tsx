"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dayjs from "dayjs";
import Header from "./Header";
import CurrencySelector from "./CurrencySelector";
import RateCards from "./RateCards";
import ChartSection from "./ChartSection";
import SkeletonLoader from "./SkeletonLoader";

export interface BankRates {
  [bank: string]: {
    buying_rate?: number;
    selling_rate?: number;
  };
}

export interface MarketStatistics {
  people_selling?: {
    max?: number;
    min?: number;
    avg?: number;
    best_bank?: string;
  };
  people_buying?: {
    max?: number;
    min?: number;
    avg?: number;
    best_bank?: string;
  };
}

export interface DayData {
  date: string;
  bank_rates?: BankRates;
  market_statistics?: MarketStatistics;
  last_updated?: string | { $date: string } | Date;
  data_completeness?: {
    update_timestamp?: string | { $date: string };
  };
}

const CURRENCIES = ["usd", "aud", "eur", "gbp"] as const;
export type Currency = (typeof CURRENCIES)[number];

interface CurrencyCache {
  data: DayData[];
  banks: string[];
}

export default function Dashboard() {
  const [currency, setCurrency] = useState<Currency>("usd");
  const [data, setData] = useState<DayData[]>([]);
  const [allBankNames, setAllBankNames] = useState<string[]>([]);
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [rateType, setRateType] = useState<"buying_rate" | "selling_rate">(
    "buying_rate"
  );
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client-side cache to make currency switching instant
  const cacheRef = useRef<Record<string, CurrencyCache>>({});
  const inFlightRef = useRef<Partial<Record<Currency, Promise<CurrencyCache>>>>(
    {}
  );
  const requestIdRef = useRef(0);
  const hasPrefetchedRef = useRef(false);

  const processRawData = useCallback((rawData: DayData[]) => {
    const processedData: DayData[] = rawData
      .map((d: DayData) => ({
        ...d,
        date: dayjs(d.date).format("YYYY-MM-DD"),
      }))
      .sort(
        (a: DayData, b: DayData) =>
          dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
      );

    const banks = new Set<string>();
    processedData.forEach((d: DayData) => {
      if (d.bank_rates) {
        Object.keys(d.bank_rates).forEach((bank) => banks.add(bank));
      }
    });

    return { data: processedData, banks: Array.from(banks).sort() };
  }, []);

  const applyData = useCallback(
    (cached: CurrencyCache) => {
      setData(cached.data);
      setAllBankNames(cached.banks);

      const defaultBanks = [
        "Hatton National Bank",
        "Sampath Bank",
        "Commercial Bank",
        "Bank of Ceylon",
      ].filter((b) => cached.banks.includes(b));
      setSelectedBanks(
        defaultBanks.length > 0 ? defaultBanks : cached.banks.slice(0, 4)
      );
    },
    []
  );

  const loadCurrency = useCallback(
    async (curr: Currency) => {
      if (cacheRef.current[curr]) {
        return cacheRef.current[curr];
      }

      if (!inFlightRef.current[curr]) {
        inFlightRef.current[curr] = (async () => {
          const response = await fetch(`/api/rates/${curr}`);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Server responded with ${response.status}: ${errorText}`
            );
          }

          const rawData = await response.json();
          if (!rawData || rawData.length === 0) {
            throw new Error(`No data available for ${curr.toUpperCase()}.`);
          }

          const processed = processRawData(rawData);
          cacheRef.current[curr] = processed;
          return processed;
        })().finally(() => {
          delete inFlightRef.current[curr];
        });
      }

      return inFlightRef.current[curr] as Promise<CurrencyCache>;
    },
    [processRawData]
  );

  const fetchCurrency = useCallback(
    async (curr: Currency) => {
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const processed = await loadCurrency(curr);

        if (requestId !== requestIdRef.current) {
          return;
        }

        applyData(processed);
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error(`Dashboard initialization failed for ${curr}:`, err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [loadCurrency, applyData]
  );

  // Prefetch all currencies in the background on initial load
  const prefetchAll = useCallback(async () => {
    for (const curr of CURRENCIES) {
      if (!cacheRef.current[curr]) {
        try {
          await loadCurrency(curr);
        } catch {
          // Silently fail prefetch — will retry when user switches
        }
      }
    }
  }, [loadCurrency]);

  useEffect(() => {
    void fetchCurrency(currency).then(() => {
      if (!hasPrefetchedRef.current) {
        hasPrefetchedRef.current = true;
        void prefetchAll();
      }
    });
  }, [currency, fetchCurrency]);

  const handleCurrencyChange = (curr: Currency) => {
    if (curr !== currency) {
      setCurrency(curr);
    }
  };

  const handleBankToggle = (bank: string) => {
    setSelectedBanks((prev) =>
      prev.includes(bank)
        ? prev.filter((b) => b !== bank)
        : [...prev, bank]
    );
  };

  return (
    <>
      <div className="fade-in-up">
        <Header currency={currency} />
      </div>

      <div className="fade-in-up fade-in-up-delay-1">
        <CurrencySelector
          currencies={CURRENCIES as unknown as Currency[]}
          selected={currency}
          onChange={handleCurrencyChange}
        />
      </div>

      {loading ? (
        <SkeletonLoader />
      ) : error ? (
        <div className="error-container fade-in-up">
          <h2 className="error-title">Failed to Load Data</h2>
          <p className="error-message">
            Could not load data for {currency.toUpperCase()}. {error}
          </p>
        </div>
      ) : (
        <>
          <div className="fade-in-up fade-in-up-delay-2">
            <RateCards data={data} currency={currency} />
          </div>

          <div className="fade-in-up fade-in-up-delay-3">
            <ChartSection
              data={data}
              allBankNames={allBankNames}
              selectedBanks={selectedBanks}
              rateType={rateType}
              timeRange={timeRange}
              currency={currency}
              onRateTypeChange={setRateType}
              onTimeRangeChange={setTimeRange}
              onBankToggle={handleBankToggle}
            />
          </div>
        </>
      )}
    </>
  );
}
