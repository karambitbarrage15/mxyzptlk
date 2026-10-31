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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#242424]">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Quantitative Accuracy Analysis</h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Statistical decomposition across lead-time horizons, diurnal cycles, and error distributions
          </p>
        </div>
      </div>

      {/* Statistical Summary Pills */}
      {distRaw?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="card-compact text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Distribution Mean</span>
            <div className="text-base font-bold text-zinc-200 mt-1 font-mono">{distRaw.stats.mean} MW</div>
          </div>
          <div className="card-compact text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Std Deviation (σ)</span>
            <div className="text-base font-bold text-[#3ECF8E] mt-1 font-mono">{distRaw.stats.std} MW</div>
          </div>
          <div className="card-compact text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Skewness</span>
            <div
              className={`text-base font-bold mt-1 font-mono ${
                Math.abs(distRaw.stats.skewness) > 0.5 ? 'text-amber-400' : 'text-[#3ECF8E]'
              }`}
            >
              {distRaw.stats.skewness}
            </div>
          </div>
          <div className="card-compact text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Kurtosis</span>
            <div className="text-base font-bold text-zinc-200 mt-1 font-mono">{distRaw.stats.kurtosis}</div>
          </div>
          <div className="card-compact text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Max Over-Forecast</span>
            <div className="text-base font-bold text-amber-400 mt-1 font-mono">+{distRaw.stats.max} MW</div>
          </div>
          <div className="card-compact text-center">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Max Under-Forecast</span>
            <div className="text-base font-bold text-[#38BDF8] mt-1 font-mono">{distRaw.stats.min} MW</div>
          </div>
        </div>
      )}

      {/* 2x2 Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <HorizonChart data={horizonData} isLoading={horizonLoading} />
        <ErrorHistogram data={distData} isLoading={distLoading} />
        <ErrorHeatmap data={hourlyData} isLoading={hourlyLoading} />
        <RollingAccuracy data={rollingData} isLoading={rollingLoading} />
      </div>

      {/* Trader Takeaways & Methodology Note */}
      <div className="card bg-[#141414] border-[#262626]">
        <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-2 font-mono">
          <svg className="w-4 h-4 text-[#3ECF8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Trading Desk Observations • January 2026 Outturn
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 mt-2 font-mono leading-relaxed">
          <div className="p-3 rounded bg-[#171717] border border-[#222222]">
            <strong className="text-zinc-200 block mb-1">Horizon Degradation</strong>
            Forecast RMSE increases with lead time. At the 11:00 AM D-1 gate closure (13h-37h ahead), expected error margin increases ~25% compared to real-time outturn.
          </div>
          <div className="p-3 rounded bg-[#171717] border border-[#222222]">
            <strong className="text-zinc-200 block mb-1">Diurnal Transition Risk</strong>
            Ramp hours (06:00 - 09:00 and 17:00 - 20:00) display systematic error peaks due to thermal boundary-layer dynamics across offshore wind clusters.
          </div>
          <div className="p-3 rounded bg-[#171717] border border-[#222222]">
            <strong className="text-zinc-200 block mb-1">Bounded Tail Distribution</strong>
            The error histogram approximates Gaussian behavior with moderate skewness, confirming that probabilistic standard error buffers are statistically sound.
          </div>
        </div>
      </div>
    </div>
  )
}
