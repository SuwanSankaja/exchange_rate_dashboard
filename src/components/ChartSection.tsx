"use client";

import { useRef, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import dayjs from "dayjs";
import type { DayData, Currency } from "./Dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHART_COLORS = [
  "#34d399",
  "#60a5fa",
  "#f87171",
  "#fbbf24",
  "#a78bfa",
  "#f472b6",
  "#4ade80",
  "#2dd4bf",
  "#818cf8",
  "#fb923c",
];

const TIME_RANGES = [
  { key: "7d", label: "7D" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
] as const;

interface ChartSectionProps {
  data: DayData[];
  allBankNames: string[];
  selectedBanks: string[];
  rateType: "buying_rate" | "selling_rate";
  timeRange: string;
  currency: Currency;
  onRateTypeChange: (type: "buying_rate" | "selling_rate") => void;
  onTimeRangeChange: (range: string) => void;
  onBankToggle: (bank: string) => void;
}

function filterByTimeRange(data: DayData[], range: string): DayData[] {
  if (range === "all") return data;
  const now = dayjs();
  let startDate: dayjs.Dayjs;
  switch (range) {
    case "7d":
      startDate = now.subtract(7, "day");
      break;
    case "1m":
      startDate = now.subtract(1, "month");
      break;
    case "3m":
      startDate = now.subtract(3, "month");
      break;
    case "6m":
      startDate = now.subtract(6, "month");
      break;
    case "1y":
      startDate = now.subtract(1, "year");
      break;
    default:
      return data;
  }
  return data.filter((d) => dayjs(d.date).isAfter(startDate));
}

export default function ChartSection({
  data,
  allBankNames,
  selectedBanks,
  rateType,
  timeRange,
  currency,
  onRateTypeChange,
  onTimeRangeChange,
  onBankToggle,
}: ChartSectionProps) {
  const chartRef = useRef<ChartJS<"line">>(null);

  const filteredData = useMemo(
    () => filterByTimeRange(data, timeRange),
    [data, timeRange]
  );

  const chartData = useMemo(() => {
    const labels = filteredData.map((d) => d.date);
    const datasets = selectedBanks.map((bankName) => {
      const bankIndex = allBankNames.indexOf(bankName);
      const color = CHART_COLORS[bankIndex % CHART_COLORS.length];
      const dataPoints = filteredData.map(
        (dayData) =>
          dayData.bank_rates?.[bankName]?.[rateType] || null
      );

      return {
        label: bankName,
        data: dataPoints,
        borderColor: color,
        backgroundColor: `${color}18`,
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: "#0a0e1a",
        pointHoverBorderWidth: 2,
      };
    });

    return { labels, datasets };
  }, [filteredData, selectedBanks, allBankNames, rateType]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: "easeInOutQuart" as const,
      },
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            color: "#64748b",
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: typeof window !== "undefined" && window.innerWidth < 768 ? 4 : 8,
            font: { size: 11, family: "Inter" },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.04)",
          },
          border: {
            color: "rgba(255, 255, 255, 0.06)",
          },
        },
        y: {
          ticks: {
            color: "#64748b",
            font: { size: 11, family: "Inter" },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.04)",
          },
          border: {
            color: "rgba(255, 255, 255, 0.06)",
          },
          title: {
            display: true,
            text: `Rate (${currency.toUpperCase()} → LKR)`,
            color: "#94a3b8",
            font: { size: 12, family: "Inter", weight: 500 as const },
          },
        },
      },
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: "#94a3b8",
            usePointStyle: true,
            pointStyle: "circle" as const,
            boxWidth: 6,
            padding: 16,
            font: { size: 11, family: "Inter" },
          },
        },
        tooltip: {
          backgroundColor: "#1e293b",
          titleColor: "#f1f5f9",
          bodyColor: "#cbd5e1",
          borderColor: "#334155",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 13, family: "Inter", weight: 600 as const },
          bodyFont: { size: 12, family: "Inter" },
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
          boxPadding: 4,
          usePointStyle: true,
        },
      },
    }),
    [currency]
  );

  // Force chart resize on window resize
  useEffect(() => {
    const handleResize = () => {
      chartRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="glass-card chart-section">
      <h2 className="chart-section-title">
        Historical Rate Analysis (Bank&apos;s Perspective)
      </h2>

      {/* Controls */}
      <div className="chart-controls">
        {/* Rate Type Toggle */}
        <div className="rate-type-toggle">
          <button
            className={`rate-type-btn ${
              rateType === "buying_rate" ? "rate-type-btn-active" : ""
            }`}
            onClick={() => onRateTypeChange("buying_rate")}
          >
            Buying Rate
          </button>
          <button
            className={`rate-type-btn ${
              rateType === "selling_rate" ? "rate-type-btn-active" : ""
            }`}
            onClick={() => onRateTypeChange("selling_rate")}
          >
            Selling Rate
          </button>
        </div>

        {/* Time Range */}
        <div className="time-range-selector">
          {TIME_RANGES.map(({ key, label }) => (
            <button
              key={key}
              className={`time-range-btn ${
                timeRange === key ? "time-range-btn-active" : ""
              }`}
              onClick={() => onTimeRangeChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bank Selector */}
      <div>
        <p className="bank-selector-label">Select Banks</p>
        <div className="bank-chips">
          {allBankNames.map((bank, index) => {
            const isActive = selectedBanks.includes(bank);
            const color = CHART_COLORS[index % CHART_COLORS.length];
            return (
              <button
                key={bank}
                className={`bank-chip ${isActive ? "bank-chip-active" : ""}`}
                onClick={() => onBankToggle(bank)}
                style={isActive ? { borderColor: `${color}40` } : undefined}
              >
                <span
                  className="bank-chip-dot"
                  style={{
                    backgroundColor: isActive ? color : "#475569",
                    color: color,
                  }}
                />
                {bank}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
