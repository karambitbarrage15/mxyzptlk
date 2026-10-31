# WindSight — UK Wind Power Forecast Analytics Platform

A web application for UK energy utility procurement teams to visualize national wind power generation forecasts vs actuals, evaluate forecast accuracy, and support day-ahead market purchase decisions.

Built for the UK day-ahead electricity market, WindSight helps traders understand how much thermal power needs to be procured beyond available wind generation by providing clear forecast visibility and quantified error analysis.

## 🔗 Live Application

- **Live Platform**: [https://modest-faraday-nine.vercel.app](https://modest-faraday-nine.vercel.app)
- **Interactive API Documentation (Swagger)**: [https://modest-faraday-nine.vercel.app/docs](https://modest-faraday-nine.vercel.app/docs)
- **API Health Check**: [https://modest-faraday-nine.vercel.app/health](https://modest-faraday-nine.vercel.app/health)

## 📁 Project Structure

```
├── README.md                 # This file
├── docker-compose.yml        # Docker Compose for local development
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── main.py           # FastAPI application entry point
│   │   ├── config.py         # Configuration and constants
│   │   ├── routers/          # API route handlers
│   │   │   ├── actuals.py    # /api/actuals — wind generation actuals
│   │   │   ├── forecasts.py  # /api/forecasts — wind generation forecasts
│   │   │   ├── metrics.py    # /api/metrics — accuracy metrics (MAE, RMSE, etc.)
│   │   │   └── analysis.py   # /api/analysis/* — advanced analytics
│   │   ├── services/         # Business logic
│   │   │   ├── elexon_client.py  # Elexon BMRS API client
│   │   │   ├── cache.py          # File-based caching layer
│   │   │   ├── data_processor.py # Data merging and metric computation
│   │   │   └── analytics.py      # Forecast horizon, error distribution, etc.
│   │   └── models/
│   │       └── schemas.py    # Pydantic response models
│   ├── tests/                # Backend tests
│   ├── Dockerfile            # Backend Docker image
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── App.jsx           # Router and layout
│   │   ├── main.jsx          # React entry point
│   │   ├── pages/            # Page components
│   │   │   ├── DashboardPage.jsx         # KPI overview + main chart
│   │   │   ├── ForecastExplorerPage.jsx  # Interactive forecast explorer
│   │   │   ├── AccuracyAnalysisPage.jsx  # Deep-dive accuracy analytics
│   │   │   └── DecisionSupportPage.jsx   # Trader decision support tools
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Layout/       # Sidebar, page wrapper
│   │   │   ├── Dashboard/    # KPI cards, charts, tables
│   │   │   ├── ForecastExplorer/  # Time-series explorer components
│   │   │   ├── AccuracyAnalysis/  # Error analysis charts
│   │   │   └── DecisionSupport/   # Forecast panels, confidence bands
│   │   ├── hooks/            # TanStack Query data hooks
│   │   ├── api/              # API client configuration
│   │   └── utils/            # Formatting utilities
│   ├── Dockerfile            # Frontend Docker image (multi-stage with nginx)
│   ├── nginx.conf            # Nginx configuration
│   └── package.json          # Node.js dependencies
└── docs/
    └── architecture.md       # Architecture documentation
```

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Or: Python 3.11+, Node.js 20+

### Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Start both frontend and backend
docker-compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Run without Docker

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

## 📊 Data Sources

All data comes from the [Elexon BMRS API](https://bmrs.elexon.co.uk/api-documentation) (no API key required):

| Dataset | Endpoint | Description |
|---------|----------|-------------|
| **FUELHH** | `/datasets/FUELHH/stream` | Half-hourly actual wind generation (MW) |
| **WINDFOR** | `/datasets/WINDFOR/stream` | Wind generation forecasts with publish timestamps |

**Scope**: National-level UK wind power data for **January 2026**.

## 📈 Features

### Dashboard
- Key Performance Indicator (KPI) cards showing MAE, RMSE, MAPE, Bias, Max Error, and Correlation
- Overlay chart of forecast vs actual wind generation across January 2026

### Forecast Explorer
- Interactive time-series chart with zoom, pan, and hover tooltips
- Date range filtering for specific periods within January 2026
- Visual error bands between forecast and actual values

### Accuracy Analysis
- **Forecast Horizon Analysis**: How accuracy degrades with increasing lead time
- **Error Distribution**: Histogram with normal distribution fit, skewness, and kurtosis
- **Hourly Error Patterns**: Identifies which hours of the day have the worst forecast accuracy
- **Rolling Accuracy**: 7-day rolling RMSE to track forecast quality over time

### Decision Support
- Latest available forecast for upcoming settlement periods
- Confidence bands (P10/P50/P90) derived from historical forecast errors
- Practical guidance for setting procurement buffers

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         React Frontend              │
│  Plotly.js • TailwindCSS • TanStack │
│         Deployed on Vercel          │
├─────────────────────────────────────┤
│         Python Backend              │
│  FastAPI • Pandas • NumPy           │
│        Deployed on Render           │
├─────────────────────────────────────┤
│       Elexon BMRS API v4            │
│  FUELHH (actuals) • WINDFOR (fcast) │
└─────────────────────────────────────┘
```

## 🧪 Testing

```bash
cd backend
pip install pytest
pytest tests/ -v
```

## 🤖 AI Tools Disclosure

This project was developed with assistance from AI coding tools (Google Antigravity / Claude). AI was used for:
- Architecture planning and design decisions
- Code generation and implementation
- Data analysis methodology design

All generated code was reviewed and validated by the developer.

## 📝 License

MIT
