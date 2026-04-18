<div align="center">

# 💱 Exchange Rate Tracker

### Real-time LKR exchange rates across Sri Lankan banks

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-exrates.suwansankaja.com-6366f1?style=for-the-badge)](https://exrates.suwansankaja.com/)
[![Next.js](https://img.shields.io/badge/Next.js_15-000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## ⚡ Overview

Exchange Rate Tracker provides a **premium, real-time dashboard** to monitor exchange rates of **USD, AUD, EUR, and GBP** against the Sri Lankan Rupee (LKR). Compare rates across 9+ banks, analyze historical trends with interactive charts, and find the best deals — all in a beautifully crafted dark-themed UI.

> 🔗 **Try it live:** [exrates.suwansankaja.com](https://exrates.suwansankaja.com/)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **Multi-Currency Support** | Instantly switch between USD, AUD, EUR, and GBP |
| 📊 **Interactive Charts** | Historical trend analysis with Chart.js — filter by bank, time range, and rate type |
| 🏦 **Bank Comparison** | Compare buying & selling rates across 9+ Sri Lankan banks |
| 💎 **Best Rate Highlights** | Instantly see the best selling/buying rates with bank names |
| 🌙 **Premium Dark UI** | Glassmorphism design with aurora background and micro-animations |
| ⚡ **Edge-Cached** | CDN caching + client-side prefetching for instant currency switching |
| 📱 **Fully Responsive** | Optimized for desktop, tablet, and mobile |
| 🔒 **Secure** | Environment secrets encrypted via Cloudflare Workers |

---

## 🛠️ Tech Stack

```
Frontend     →  Next.js 15 · React 19 · TypeScript · Chart.js · Day.js
Styling      →  Vanilla CSS · Glassmorphism · CSS Custom Properties
Backend      →  Next.js API Routes · MongoDB Driver
Database     →  MongoDB Atlas
Deployment   →  Cloudflare Workers · OpenNext Adapter
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/SuwanSankaja/exchange_rate_dashboard.git
cd exchange_rate_dashboard

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DB_NAME=exchange_rates
COLLECTION_PREFIX=daily_
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment (Cloudflare Workers)

This app is deployed on **Cloudflare Workers** using the [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) adapter.

### Quick Deploy

```bash
# Build & deploy to Cloudflare
npm run deploy
```

### Environment Setup on Cloudflare

1. Go to **Workers & Pages** → your worker → **Settings** → **Variables and Secrets**
2. Add `MONGO_URI` as a **Secret**
3. `DB_NAME` and `COLLECTION_PREFIX` are set automatically via `wrangler.jsonc`

### Build Commands (for CI/CD)

| Command | Description |
|---------|-------------|
| `npx opennextjs-cloudflare build` | Build for Cloudflare Workers |
| `npx opennextjs-cloudflare deploy` | Deploy to production |

---

## 📡 API

The app exposes a RESTful API for fetching exchange rate data:

```
GET /api/rates/:currency
```

| Parameter | Type | Values |
|-----------|------|--------|
| `currency` | `string` | `usd`, `aud`, `eur`, `gbp` |

**Example:**

```bash
curl https://exrates.suwansankaja.com/api/rates/usd
```

**Response:** Array of daily rate documents with `bank_rates`, `market_statistics`, and `last_updated` fields.

**Caching:** Responses are cached at Cloudflare's edge for 10 minutes (`s-maxage=600`).

---

## 📁 Project Structure

```
exchange_rate_dashboard/
├── src/
│   ├── app/
│   │   ├── api/rates/[currency]/
│   │   │   └── route.ts          # MongoDB API handler
│   │   ├── globals.css            # Design system & animations
│   │   ├── layout.tsx             # Root layout with SEO
│   │   └── page.tsx               # Main page
│   └── components/
│       ├── Dashboard.tsx          # State management & data fetching
│       ├── Header.tsx             # Animated header
│       ├── CurrencySelector.tsx   # Currency pill selector
│       ├── RateCards.tsx          # Best rate display cards
│       ├── ChartSection.tsx       # Interactive chart with controls
│       └── SkeletonLoader.tsx     # Loading state UI
├── wrangler.jsonc                 # Cloudflare Workers config
├── open-next.config.ts            # OpenNext adapter config
├── next.config.ts                 # Next.js config
└── package.json
```

---

## 📄 License

Distributed under the MIT License.

---

<div align="center">

**Built with ❤️ by [Suwan Sankaja](https://github.com/SuwanSankaja)**

</div>