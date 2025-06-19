# Confinix Exchange

## 🚀 About The Project

Confinix Exchange provides a powerful and user-friendly interface to monitor the exchange rates of AUD, USD, EUR, and GBP against the Sri Lankan Rupee (LKR). Built with a modern tech stack, it offers real-time insights with historical data visualization, helping users make informed financial decisions. The entire application is containerized with Docker for seamless setup and deployment.

### ✨ Features

* **Multi-Currency Dashboard:** Instantly switch between AUD, USD, EUR, and GBP.

* **At-a-Glance Insights:** View the day's best buying/selling rates and market averages.

* **Interactive Graphs:** Analyze historical trends with smooth, filterable charts.

* **Dynamic Filtering:** Isolate data by rate type (buy/sell), time period, and specific banks.

* **Fully Responsive:** Optimized for a seamless experience on both desktop and mobile devices.

* **Secure & Deployed:** Live and secured with an SSL certificate via Let's Encrypt.

### 🛠️ Built With

The project is built with a modern and robust stack:

* **Frontend:** HTML5, Tailwind CSS, Chart.js, Day.js

* **Backend:** Node.js, Express.js

* **Database:** MongoDB

* **Deployment & DevOps:** Docker, Docker Compose, Nginx, Certbot

## 🔧 Getting Started (Local Development)

To get a local copy up and running, follow these simple steps.

### Prerequisites

* You must have [**Node.js**](https://nodejs.org/) (v18+) installed.

* You must have [**Docker**](https://www.docker.com/products/docker-desktop/) and Docker Compose installed.

### Installation & Launch

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/SuwanSankaja/exchange_rate_dashboard.git](https://github.com/SuwanSankaja/exchange_rate_dashboard.git)
   cd exchange_rate_dashboard
   ```

2. **Create the Environment File:**
   Create a `.env` file in the project root and populate it with the following:

   ```env
   MONGO_URI="mongodb://mongo:27017"
   DB_NAME="exchange_rates"
   COLLECTION_PREFIX="daily_"
   PORT=3000
   ```

3. **Launch with Docker Compose:**
   This command will build and start all necessary containers in the background.

   ```bash
   docker compose up --build -d
   ```

4. **Access the Application:**
   Open your browser and navigate to `http://localhost:3000`.

## 🚀 Deployment

This application is designed for easy deployment on any VPS (like a DigitalOcean Droplet) using Docker. The high-level steps involve:

1. Provisioning a server with the Docker Marketplace image.

2. Cloning the repository and setting up the `.env` file.

3. Configuring the UFW firewall to allow SSH and Nginx traffic.

4. Running the application stack with `docker compose up --build -d`.

5. Configuring Nginx as a reverse proxy to route traffic to the application.

6. Securing the domain with a free SSL certificate from Let's Encrypt.

## 📡 API Endpoint

The backend exposes a dynamic API endpoint to retrieve data for the dashboard.

* `GET /api/rates/:currency`

  * **Description:** Fetches all historical rate data for a given currency.

  * **URL Params:** `:currency` can be `aud`, `usd`, `eur`, or `gbp`.

  * **Example:** A request to `GET /api/rates/usd` will fetch all documents from the `daily_usd_rates` collection in MongoDB.