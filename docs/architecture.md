# WindSight — Architecture Documentation

## System Overview

WindSight is a full-stack web application that helps UK energy utility procurement teams make informed day-ahead market purchase decisions by providing clear visibility into wind power generation forecasts and their accuracy.

## Architecture

### High-Level Flow

```
User Browser
    ↓ HTTP
React SPA (Vercel)
    ↓ REST API calls
FastAPI Backend (Render)
    ↓ HTTP (cached)
Elexon BMRS API v4
```

### Data Flow

1. **Ingestion**: On first request (or app startup), the backend fetches January 2026 wind data from Elexon BMRS API
2. **Caching**: Raw JSON responses are cached to local files to avoid repeated API calls
3. **Processing**: Pandas DataFrames are used to merge actuals with forecasts by `startTime`, compute errors, and calculate metrics
4. **Serving**: Processed data is served via REST endpoints to the React frontend
5. **Visualization**: Frontend renders interactive Plotly charts and KPI cards

### Backend Architecture

**Framework**: FastAPI (Python 3.11)

**Key Design Decisions**:
- **Async HTTP client (httpx)**: Non-blocking data fetching from Elexon
- **File-based caching**: Simple JSON files, no database needed for static historical data
- **Pandas for analytics**: Efficient vectorized operations for metric computation
- **Pydantic models**: Type-safe request/response validation

**Service Layer**:
- `elexon_client.py`: Handles all communication with the Elexon API
- `cache.py`: Read/write JSON cache files with TTL support
- `data_processor.py`: Core business logic — merges actuals with latest forecasts, computes all accuracy metrics
- `analytics.py`: Advanced analysis — horizon degradation, error distribution, hourly patterns, rolling metrics

### Frontend Architecture

**Framework**: React 18 + Vite

**Key Design Decisions**:
- **Plotly.js**: Industry-standard charting library with rich interactivity (zoom, pan, hover)
- **TanStack Query**: Automatic caching, refetching, and state management for API data
- **TailwindCSS**: Utility-first CSS for rapid, consistent styling
- **Dark theme**: Professional Bloomberg-terminal inspired UI

**Component Hierarchy**:
```
App
├── Sidebar (navigation)
└── PageWrapper
    ├── DashboardPage
    │   ├── KPICards
    │   ├── ForecastActualChart
    │   └── SummaryTable
    ├── ForecastExplorerPage
    │   ├── DateRangeFilter
    │   └── TimeSeriesChart
    ├── AccuracyAnalysisPage
    │   ├── HorizonChart
    │   ├── ErrorHistogram
    │   ├── ErrorHeatmap
    │   └── RollingAccuracy
    └── DecisionSupportPage
        ├── LatestForecastPanel
        └── ConfidenceBands
```

## API Design

All endpoints return JSON. No authentication required.

| Endpoint | Purpose | Key Response Fields |
|----------|---------|-------------------|
| GET /api/actuals | Raw wind actuals | startTime, generation |
| GET /api/forecasts | Raw wind forecasts | startTime, publishTime, generation |
| GET /api/forecasts/latest | Latest forecast per period | startTime, generation, publishTime |
| GET /api/metrics | Aggregate accuracy metrics | mae, rmse, mape, bias, maxError, correlation |
| GET /api/analysis/forecast-vs-actual | Merged timeseries | startTime, actual, forecast, error |
| GET /api/analysis/horizon | Accuracy vs lead time | leadTimeHours, rmse, mae, count |
| GET /api/analysis/hourly-errors | Errors by hour of day | hour, meanError, rmse |
| GET /api/analysis/error-distribution | Error histogram | bins, counts, stats |
| GET /api/analysis/daily-metrics | Daily accuracy | date, mae, rmse, mape |
| GET /api/analysis/rolling-accuracy | Rolling RMSE | date, rmse |

## Deployment

### Production Architecture
- **Frontend**: Static build deployed to Vercel (global CDN)
- **Backend**: Docker container on Render (free tier)
- **Data**: Fetched from Elexon and cached on first access

### Local Development
- Docker Compose orchestrates both services
- Frontend dev server proxies `/api` requests to backend
- Hot-reload enabled for both frontend and backend

## Security Considerations

- No sensitive data (Elexon API is public)
- CORS configured to allow frontend origin
- No user authentication needed for this pilot
- Rate limiting on Elexon API respected via aggressive caching
