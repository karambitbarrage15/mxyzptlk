"""
Tests for the metrics computation logic.
"""
import numpy as np
import pandas as pd
import pytest

from app.services.data_processor import (
    normalize_actuals,
    normalize_forecasts,
    get_latest_forecasts,
    merge_forecast_actual,
    compute_metrics,
)
from app.services.analytics import (
    compute_hourly_errors,
    compute_error_distribution,
    compute_daily_metrics,
    compute_rolling_accuracy,
)


# --- Test Data Fixtures ---

def make_actuals(n=48):
    """Create sample actuals data for testing."""
    base_time = pd.Timestamp("2026-01-01T00:00:00Z")
    records = []
    for i in range(n):
        records.append({
            "startTime": (base_time + pd.Timedelta(minutes=30 * i)).isoformat(),
            "settlementPeriod": i + 1,
            "generation": 5000 + 1000 * np.sin(2 * np.pi * i / 48),
        })
    return records


def make_forecasts(n=48, num_publishes=3):
    """Create sample forecast data with multiple publish times per startTime."""
    base_time = pd.Timestamp("2026-01-01T00:00:00Z")
    records = []
    for i in range(n):
        start_time = base_time + pd.Timedelta(minutes=30 * i)
        for p in range(num_publishes):
            # Earlier publishes have larger errors
            publish_time = start_time - pd.Timedelta(hours=(num_publishes - p) * 4)
            noise = (num_publishes - p) * 100  # More noise for earlier forecasts
            records.append({
                "startTime": start_time.isoformat(),
                "publishTime": publish_time.isoformat(),
                "generation": 5000 + 1000 * np.sin(2 * np.pi * i / 48) + noise,
            })
    return records


# --- Normalization Tests ---

class TestNormalization:

    def test_normalize_actuals_basic(self):
        raw = make_actuals(10)
        df = normalize_actuals(raw)
        assert len(df) == 10
        assert "startTime" in df.columns
        assert "generation" in df.columns
        assert df["generation"].dtype == np.float64

    def test_normalize_actuals_empty(self):
        df = normalize_actuals([])
        assert df.empty

    def test_normalize_forecasts_basic(self):
        raw = make_forecasts(10, num_publishes=2)
        df = normalize_forecasts(raw)
        assert len(df) == 20  # 10 periods * 2 publishes
        assert "startTime" in df.columns
        assert "publishTime" in df.columns
        assert "generation" in df.columns

    def test_normalize_forecasts_empty(self):
        df = normalize_forecasts([])
        assert df.empty


# --- Latest Forecast Selection Tests ---

class TestLatestForecasts:

    def test_get_latest_forecasts(self):
        raw = make_forecasts(10, num_publishes=3)
        df = normalize_forecasts(raw)
        latest = get_latest_forecasts(df)

        # Should have exactly one row per startTime
        assert len(latest) == 10

        # Verify each row has the latest publishTime
        for _, row in latest.iterrows():
            all_for_start = df[df["startTime"] == row["startTime"]]
            assert row["publishTime"] == all_for_start["publishTime"].max()

    def test_get_latest_forecasts_empty(self):
        df = pd.DataFrame(columns=["startTime", "publishTime", "generation"])
        latest = get_latest_forecasts(df)
        assert latest.empty


# --- Merge Tests ---

class TestMerge:

    def test_merge_forecast_actual(self):
        actuals_raw = make_actuals(10)
        forecasts_raw = make_forecasts(10, num_publishes=2)

        actuals_df = normalize_actuals(actuals_raw)
        forecasts_df = normalize_forecasts(forecasts_raw)

        merged = merge_forecast_actual(actuals_df, forecasts_df)
        assert len(merged) == 10
        assert "actual" in merged.columns
        assert "forecast" in merged.columns
        assert "error" in merged.columns

        # Error should be forecast - actual
        for _, row in merged.iterrows():
            assert abs(row["error"] - (row["forecast"] - row["actual"])) < 0.01

    def test_merge_empty_actuals(self):
        actuals_df = pd.DataFrame(columns=["startTime", "generation"])
        forecasts_df = normalize_forecasts(make_forecasts(10))
        merged = merge_forecast_actual(actuals_df, forecasts_df)
        assert merged.empty


# --- Metrics Tests ---

class TestMetrics:

    def test_compute_metrics_basic(self):
        actuals_raw = make_actuals(48)
        forecasts_raw = make_forecasts(48, num_publishes=1)

        actuals_df = normalize_actuals(actuals_raw)
        forecasts_df = normalize_forecasts(forecasts_raw)
        merged = merge_forecast_actual(actuals_df, forecasts_df)

        metrics = compute_metrics(merged)

        assert "mae" in metrics
        assert "rmse" in metrics
        assert "mape" in metrics
        assert "bias" in metrics
        assert "max_absolute_error" in metrics
        assert "correlation" in metrics
        assert "sample_count" in metrics

        # MAE should be non-negative
        assert metrics["mae"] >= 0
        # RMSE should be >= MAE
        assert metrics["rmse"] >= metrics["mae"]
        # Correlation should be between -1 and 1
        assert -1 <= metrics["correlation"] <= 1
        # Sample count should match
        assert metrics["sample_count"] == len(merged)

    def test_compute_metrics_perfect_forecast(self):
        """When forecast equals actual, MAE and RMSE should be zero."""
        base_time = pd.Timestamp("2026-01-01T00:00:00Z")
        actuals_raw = [
            {"startTime": (base_time + pd.Timedelta(minutes=30 * i)).isoformat(),
             "generation": 5000.0}
            for i in range(10)
        ]
        forecasts_raw = [
            {"startTime": (base_time + pd.Timedelta(minutes=30 * i)).isoformat(),
             "publishTime": (base_time + pd.Timedelta(minutes=30 * i) - pd.Timedelta(hours=1)).isoformat(),
             "generation": 5000.0}
            for i in range(10)
        ]

        actuals_df = normalize_actuals(actuals_raw)
        forecasts_df = normalize_forecasts(forecasts_raw)
        merged = merge_forecast_actual(actuals_df, forecasts_df)
        metrics = compute_metrics(merged)

        assert metrics["mae"] == 0.0
        assert metrics["rmse"] == 0.0
        assert metrics["bias"] == 0.0
        assert metrics["max_absolute_error"] == 0.0

    def test_compute_metrics_known_values(self):
        """Test with known error values for exact metric verification."""
        base_time = pd.Timestamp("2026-01-01T00:00:00Z")
        # Actuals: [100, 200, 300, 400, 500]
        # Forecasts: [110, 190, 310, 380, 520]
        # Errors: [10, -10, 10, -20, 20]
        actuals_vals = [100, 200, 300, 400, 500]
        forecast_vals = [110, 190, 310, 380, 520]

        actuals_raw = [
            {"startTime": (base_time + pd.Timedelta(minutes=30 * i)).isoformat(),
             "generation": a}
            for i, a in enumerate(actuals_vals)
        ]
        forecasts_raw = [
            {"startTime": (base_time + pd.Timedelta(minutes=30 * i)).isoformat(),
             "publishTime": (base_time + pd.Timedelta(minutes=30 * i) - pd.Timedelta(hours=1)).isoformat(),
             "generation": f}
            for i, f in enumerate(forecast_vals)
        ]

        actuals_df = normalize_actuals(actuals_raw)
        forecasts_df = normalize_forecasts(forecasts_raw)
        merged = merge_forecast_actual(actuals_df, forecasts_df)
        metrics = compute_metrics(merged)

        errors = np.array([10, -10, 10, -20, 20])
        expected_mae = np.mean(np.abs(errors))
        expected_rmse = np.sqrt(np.mean(errors ** 2))
        expected_bias = np.mean(errors)

        assert abs(metrics["mae"] - round(expected_mae, 2)) < 0.01
        assert abs(metrics["rmse"] - round(expected_rmse, 2)) < 0.01
        assert abs(metrics["bias"] - round(expected_bias, 2)) < 0.01
        assert metrics["sample_count"] == 5

    def test_compute_metrics_empty(self):
        merged = pd.DataFrame(columns=["actual", "forecast", "error"])
        metrics = compute_metrics(merged)
        assert metrics["sample_count"] == 0


# --- Analytics Tests ---

class TestAnalytics:

    def _get_merged(self, n=96):
        actuals_raw = make_actuals(n)
        forecasts_raw = make_forecasts(n, num_publishes=1)
        actuals_df = normalize_actuals(actuals_raw)
        forecasts_df = normalize_forecasts(forecasts_raw)
        return merge_forecast_actual(actuals_df, forecasts_df)

    def test_hourly_errors(self):
        merged = self._get_merged(96)  # 2 full days
        results = compute_hourly_errors(merged)
        assert len(results) > 0
        for r in results:
            assert "hour" in r
            assert 0 <= r["hour"] <= 23
            assert "mean_error" in r
            assert "rmse" in r

    def test_error_distribution(self):
        merged = self._get_merged(48)
        result = compute_error_distribution(merged, num_bins=20)
        assert "bins" in result
        assert "stats" in result
        assert len(result["bins"]) == 20
        assert "mean" in result["stats"]
        assert "std" in result["stats"]
        assert "skewness" in result["stats"]
        assert "kurtosis" in result["stats"]

    def test_error_distribution_empty(self):
        merged = pd.DataFrame(columns=["error"])
        result = compute_error_distribution(merged)
        assert result["bins"] == []

    def test_daily_metrics(self):
        merged = self._get_merged(96)  # 2 full days
        results = compute_daily_metrics(merged)
        assert len(results) >= 2
        for r in results:
            assert "date" in r
            assert "mae" in r
            assert "rmse" in r
            assert "mape" in r
            assert r["mae"] >= 0
            assert r["rmse"] >= r["mae"]

    def test_rolling_accuracy(self):
        # Need more data points for a meaningful rolling window
        merged = self._get_merged(48 * 10)  # 10 days
        result = compute_rolling_accuracy(merged, window_days=3)
        assert result["window_days"] == 3
        assert len(result["data"]) > 0
        for r in result["data"]:
            assert "date" in r
            assert "rmse" in r
            assert r["rmse"] >= 0

    def test_rolling_accuracy_empty(self):
        merged = pd.DataFrame(columns=["startTime", "error"])
        result = compute_rolling_accuracy(merged, window_days=7)
        assert result["data"] == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
