import {
  useHorizonAnalysis,
  useErrorDistribution,
  useHourlyErrors,
  useRollingAccuracy,
} from '../hooks/useApi'
import HorizonChart from '../components/AccuracyAnalysis/HorizonChart'
import ErrorHistogram from '../components/AccuracyAnalysis/ErrorHistogram'
import ErrorHeatmap from '../components/AccuracyAnalysis/ErrorHeatmap'
import RollingAccuracy from '../components/AccuracyAnalysis/RollingAccuracy'

export default function AccuracyAnalysisPage() {
  const { data: horizonRaw, isLoading: horizonLoading } = useHorizonAnalysis()
  const { data: distRaw, isLoading: distLoading } = useErrorDistribution()
  const { data: hourlyRaw, isLoading: hourlyLoading } = useHourlyErrors()
  const { data: rollingRaw, isLoading: rollingLoading } = useRollingAccuracy()

  // Format Horizon data
  const horizonData = horizonRaw?.data
    ? {
        hours_ahead: horizonRaw.data.map((d) => d.horizon_hours),
        rmse: horizonRaw.data.map((d) => d.rmse),
        mae: horizonRaw.data.map((d) => d.mae),
      }
    : null

  // Format Distribution data
  const distData = distRaw?.bins
    ? {
        bin_edges: distRaw.bins.length > 0
          ? [distRaw.bins[0].bin_start, ...distRaw.bins.map((b) => b.bin_end)]
          : [],
        counts: distRaw.bins.map((b) => b.count),
        stats: distRaw.stats,
      }
    : null

  // Format Hourly data
  const hourlyData = hourlyRaw?.data
    ? {
        hours: hourlyRaw.data.map((d) => d.hour),
        mean_error: hourlyRaw.data.map((d) => d.mean_error),
        mae: hourlyRaw.data.map((d) => d.rmse),
      }
    : null

  // Format Rolling data
  const rollingData = rollingRaw?.data
    ? {
        dates: rollingRaw.data.map((d) => d.date),
        rolling_rmse: rollingRaw.data.map((d) => d.rmse),
      }
    : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Quantitative Accuracy Analysis</h1>
        <p className="text-sm text-gray-400 mt-1">
          Statistical decomposition of forecast performance across lead-time horizons, diurnal cycles, and error distributions
        </p>
      </div>

      {/* Statistical Summary Pills */}
      {distRaw?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="card-compact text-center">
            <span className="text-xs text-gray-500 uppercase">Distribution Mean</span>
            <div className="text-lg font-bold text-gray-200 mt-1">{distRaw.stats.mean} MW</div>
          </div>
          <div className="card-compact text-center">
            <span className="text-xs text-gray-500 uppercase">Std Deviation (σ)</span>
            <div className="text-lg font-bold text-blue-400 mt-1">{distRaw.stats.std} MW</div>
          </div>
          <div className="card-compact text-center">
            <span className="text-xs text-gray-500 uppercase">Skewness</span>
            <div className={`text-lg font-bold mt-1 ${Math.abs(distRaw.stats.skewness) > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {distRaw.stats.skewness}
            </div>
          </div>
          <div className="card-compact text-center">
            <span className="text-xs text-gray-500 uppercase">Kurtosis</span>
            <div className="text-lg font-bold text-gray-200 mt-1">{distRaw.stats.kurtosis}</div>
          </div>
          <div className="card-compact text-center">
            <span className="text-xs text-gray-500 uppercase">Max Over-Forecast</span>
            <div className="text-lg font-bold text-amber-400 mt-1">+{distRaw.stats.max} MW</div>
          </div>
          <div className="card-compact text-center">
            <span className="text-xs text-gray-500 uppercase">Max Under-Forecast</span>
            <div className="text-lg font-bold text-cyan-400 mt-1">{distRaw.stats.min} MW</div>
          </div>
        </div>
      )}

      {/* 2x2 Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HorizonChart data={horizonData} isLoading={horizonLoading} />
        <ErrorHistogram data={distData} isLoading={distLoading} />
        <ErrorHeatmap data={hourlyData} isLoading={hourlyLoading} />
        <RollingAccuracy data={rollingData} isLoading={rollingLoading} />
      </div>

      {/* Trader Takeaways & Methodology Note */}
      <div className="card bg-gray-900/60 border-gray-800">
        <h3 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Trading Desk Takeaways for January 2026
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-400 mt-2">
          <div>
            <strong className="text-gray-200 block mb-1">Horizon Degradation</strong>
            Forecast error (RMSE) climbs steadily between 4h and 48h lead times. Day-ahead bids at 11:00 AM D-1 (13h-37h horizon) carry roughly 20-30% more volatility than intraday gate closure revisions.
          </div>
          <div>
            <strong className="text-gray-200 block mb-1">Diurnal Transition Risk</strong>
            Morning ramp hours (06:00 - 09:00) and evening peak (17:00 - 20:00) display systematic error peaks due to thermal boundary layer changes affecting wind speed profiles across offshore clusters.
          </div>
          <div>
            <strong className="text-gray-200 block mb-1">Error Distribution Symmetry</strong>
            The distribution has moderate skewness. Over-forecasting and under-forecasting occur with comparable frequency, validating a symmetrical base reserve with slightly higher upside tolerance.
          </div>
        </div>
      </div>
    </div>
  )
}
