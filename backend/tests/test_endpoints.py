"""
End-to-end integration tests for all API endpoints.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("ok", "healthy")
    assert "cache_status" in data


def test_actuals():
    res = client.get("/api/actuals")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    assert len(data["data"]) > 0
    first = data["data"][0]
    assert "startTime" in first
    assert "generation" in first


def test_forecasts():
    res = client.get("/api/forecasts")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    assert len(data["data"]) > 0


def test_latest_forecasts():
    res = client.get("/api/forecasts/latest")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    first = data["data"][0]
    assert "startTime" in first
    assert "publishTime" in first
    assert "generation" in first


def test_metrics():
    res = client.get("/api/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    m = data["metrics"]
    assert m["mae"] > 0
    assert m["rmse"] > 0
    assert m["sample_count"] > 0
    print("Metrics:", m)


def test_analysis_forecast_vs_actual():
    res = client.get("/api/analysis/forecast-vs-actual")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    first = data["data"][0]
    assert "startTime" in first
    assert "actual" in first
    assert "forecast" in first
    assert "error" in first


def test_analysis_horizon():
    res = client.get("/api/analysis/horizon")
    assert res.status_code == 200
    data = res.json()
    assert len(data["data"]) > 0
    first = data["data"][0]
    assert "horizon_hours" in first
    assert "rmse" in first


def test_analysis_hourly_errors():
    res = client.get("/api/analysis/hourly-errors")
    assert res.status_code == 200
    data = res.json()
    assert len(data["data"]) > 0


def test_analysis_error_distribution():
    res = client.get("/api/analysis/error-distribution")
    assert res.status_code == 200
    data = res.json()
    assert len(data["bins"]) > 0
    assert "stats" in data
    assert "mean" in data["stats"]
    assert "std" in data["stats"]


def test_analysis_daily_metrics():
    res = client.get("/api/analysis/daily-metrics")
    assert res.status_code == 200
    data = res.json()
    assert len(data["data"]) > 0


def test_analysis_rolling_accuracy():
    res = client.get("/api/analysis/rolling-accuracy?window_days=7")
    assert res.status_code == 200
    data = res.json()
    assert len(data["data"]) > 0


if __name__ == "__main__":
    test_health()
    test_actuals()
    test_forecasts()
    test_latest_forecasts()
    test_metrics()
    test_analysis_forecast_vs_actual()
    test_analysis_horizon()
    test_analysis_hourly_errors()
    test_analysis_error_distribution()
    test_analysis_daily_metrics()
    test_analysis_rolling_accuracy()
    print("ALL API ENDPOINT INTEGRATION TESTS PASSED!")
