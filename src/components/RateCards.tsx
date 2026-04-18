import dayjs from "dayjs";
import type { DayData, Currency } from "./Dashboard";

interface RateCardsProps {
  data: DayData[];
  currency: Currency;
}

function getLastUpdatedText(latestData: DayData): string {
  let lastUpdatedTimestamp: string | null = null;

  if (latestData.last_updated) {
    if (typeof latestData.last_updated === "string") {
      lastUpdatedTimestamp = latestData.last_updated;
    } else if (
      typeof latestData.last_updated === "object" &&
      "$date" in latestData.last_updated
    ) {
      lastUpdatedTimestamp = latestData.last_updated.$date;
    } else if (
      latestData.last_updated instanceof Date
    ) {
      lastUpdatedTimestamp = latestData.last_updated.toISOString();
    }
  }

  if (!lastUpdatedTimestamp && latestData.data_completeness?.update_timestamp) {
    const ts = latestData.data_completeness.update_timestamp;
    if (typeof ts === "string") {
      lastUpdatedTimestamp = ts;
    } else if (typeof ts === "object" && "$date" in ts) {
      lastUpdatedTimestamp = ts.$date;
    }
  }

  if (lastUpdatedTimestamp) {
    const lastUpdated = dayjs(lastUpdatedTimestamp);
    const now = dayjs();
    const diffMinutes = now.diff(lastUpdated, "minute");
    const diffHours = now.diff(lastUpdated, "hour");
    const diffDays = now.diff(lastUpdated, "day");

    let timeAgoText = "";
    if (diffMinutes < 1) {
      timeAgoText = "just now";
    } else if (diffMinutes < 60) {
      timeAgoText = `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      timeAgoText = `${diffHours}h ago`;
    } else if (diffDays < 7) {
      timeAgoText = `${diffDays}d ago`;
    } else {
      timeAgoText = lastUpdated.format("YYYY-MM-DD");
    }

    return `Last updated: ${lastUpdated.format("YYYY-MM-DD HH:mm")} (${timeAgoText})`;
  }

  return `Last updated: ${dayjs(latestData.date).format("YYYY-MM-DD")}`;
}

export default function RateCards({ data, currency }: RateCardsProps) {
  const latestData = data[data.length - 1];
  if (!latestData || !latestData.market_statistics) {
    return null;
  }

  const { people_selling, people_buying } = latestData.market_statistics;
  const lastUpdatedText = getLastUpdatedText(latestData);

  const bestSellingRate = people_selling?.max?.toFixed(4);
  const bestSellingBank = people_selling?.best_bank;
  const avgSellingRate = people_selling?.avg?.toFixed(4);

  const bestBuyingRate = people_buying?.min?.toFixed(4);
  const bestBuyingBank = people_buying?.best_bank;
  const avgBuyingRate = people_buying?.avg?.toFixed(4);

  return (
    <>
      <div className="rate-cards-grid">
        {/* Best Selling Rate Card */}
        <div className="glass-card glass-card-interactive rate-card rate-card-sell">
          <span className="rate-card-label rate-card-label-sell">
            Best Selling Rate
          </span>
          <span className="rate-card-description">
            The highest rate a bank will buy {currency.toUpperCase()} from you
          </span>
          <span className="rate-card-value">
            {bestSellingRate ? `LKR ${bestSellingRate}` : "N/A"}
          </span>
          {bestSellingBank && (
            <span className="rate-card-bank rate-card-bank-sell">
              at {bestSellingBank}
            </span>
          )}
          {avgSellingRate && (
            <span className="rate-card-avg">
              Avg: LKR {avgSellingRate}
            </span>
          )}
        </div>

        {/* Best Buying Rate Card */}
        <div className="glass-card glass-card-interactive rate-card rate-card-buy">
          <span className="rate-card-label rate-card-label-buy">
            Best Buying Rate
          </span>
          <span className="rate-card-description">
            The lowest rate a bank will sell {currency.toUpperCase()} to you
          </span>
          <span className="rate-card-value">
            {bestBuyingRate ? `LKR ${bestBuyingRate}` : "N/A"}
          </span>
          {bestBuyingBank && (
            <span className="rate-card-bank rate-card-bank-buy">
              at {bestBuyingBank}
            </span>
          )}
          {avgBuyingRate && (
            <span className="rate-card-avg">
              Avg: LKR {avgBuyingRate}
            </span>
          )}
        </div>
      </div>

      <p className="last-updated">{lastUpdatedText}</p>
    </>
  );
}
