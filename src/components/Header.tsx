import type { Currency } from "./Dashboard";

interface HeaderProps {
  currency: Currency;
}

export default function Header({ currency }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header-title">Exchange Rate Tracker</h1>
      <p className="header-subtitle">
        Live rates for {currency.toUpperCase()} in Sri Lanka
      </p>
    </header>
  );
}
