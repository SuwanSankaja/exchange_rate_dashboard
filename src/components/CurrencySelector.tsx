import type { Currency } from "./Dashboard";

interface CurrencySelectorProps {
  currencies: Currency[];
  selected: Currency;
  onChange: (currency: Currency) => void;
}

export default function CurrencySelector({
  currencies,
  selected,
  onChange,
}: CurrencySelectorProps) {
  return (
    <div className="currency-selector">
      <div className="currency-pills">
        {currencies.map((curr) => (
          <button
            key={curr}
            className={`currency-pill ${
              curr === selected ? "currency-pill-active" : ""
            }`}
            onClick={() => onChange(curr)}
          >
            {curr.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
