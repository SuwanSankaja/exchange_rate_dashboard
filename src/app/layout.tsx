import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exchange Rate Tracker — LKR Live Rates",
  description:
    "Track live exchange rates for USD, AUD, EUR, and GBP against the Sri Lankan Rupee (LKR). Compare bank rates, view historical trends, and find the best deals.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="aurora-bg" />
        {children}
      </body>
    </html>
  );
}
