import { useState, useMemo } from 'react'
import { useLatestForecasts, useMetrics, useErrorDistribution } from '../hooks/useApi'
import LatestForecastPanel from '../components/DecisionSupport/LatestForecastPanel'
import ConfidenceBands from '../components/DecisionSupport/ConfidenceBands'
import { formatMW } from '../utils/formatters'

export default function DecisionSupportPage() {
  const { data: latestRaw, isLoading: latestLoading } = useLatestForecasts()
  const { data: metricsRaw, isLoading: metricsLoading } = useMetrics()
  const { data: distRaw, isLoading: distLoading } = useErrorDistribution()

  // Day-Ahead Purchase Calculator state
  const [demandForecast, setDemandForecast] = useState(28000) // Default 28 GW typical UK winter demand
  const [riskTolerance, setRiskTolerance] = useState('p10') // 'p10' (conservative) or 'p50' (neutral)

  const forecasts = latestRaw?.data || []
  const metrics = metricsRaw?.metrics
  const errorStats = distRaw?.stats

  const windForecastMW = forecasts[0]?.generation || 8500
  const stdError = errorStats?.std || metrics?.rmse || 850

  // Decision Calculations
  const calculations = useMemo(() => {
    // If trader relies on P50 point forecast:
    const netShortfallP50 = Math.max(0, demandForecast - windForecastMW)

    // If trader relies on P10 conservative floor (Wind is lower by 1.282 * sigma):
    const conservativeWind = Math.max(0, windForecastMW - 1.282 * stdError)
    const netShortfallP10 = Math.max(0, demandForecast - conservativeWind)

    // Recommended buffer
    const recommendedBuffer = netShortfallP10 - netShortfallP50

    return {
      netShortfallP50,
      conservativeWind,
      netShortfallP10,
      recommendedBuffer,
    }
  }, [demandForecast, windForecastMW, stdError])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#242424]">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Day-Ahead Decision Support</h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Automated thermal sizing & quantified wind volatility buffers for 11:00 AM auction bidding
          </p>
        </div>
      </div>

      {/* Day-Ahead Auction Simulator Widget (Supabase Theme) */}
      <div className="card bg-[#141414] border-[#262626]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#222222]">
          <div>
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#3ECF8E]">
              Auction Sizing Simulator
            </span>
            <h2 className="text-sm font-semibold text-white mt-0.5">
              Day-Ahead Thermal Procurement Sizing (11:00 AM Gate Closure)
            </h2>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <button
              onClick={() => setRiskTolerance('p10')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                riskTolerance === 'p10'
                  ? 'bg-[#3ECF8E] text-[#0d1512] shadow-sm'
                  : 'bg-[#1c1c1c] text-zinc-400 hover:text-white border border-[#2e2e2e]'
              }`}
            >
              P10 Conservative (+Buffer)
            </button>
            <button
              onClick={() => setRiskTolerance('p50')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                riskTolerance === 'p50'
                  ? 'bg-zinc-200 text-black font-semibold'
                  : 'bg-[#1c1c1c] text-zinc-400 hover:text-white border border-[#2e2e2e]'
              }`}
            >
              P50 Point Forecast
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
          {/* Input: Consumer Demand */}
          <div className="p-3 bg-[#171717] rounded-md border border-[#242424]">
            <label className="text-[11px] text-zinc-400 block mb-1.5">
              Expected Consumer Demand
            </label>
            <input
              type="number"
              step="500"
              value={demandForecast}
              onChange={(e) => setDemandForecast(Number(e.target.value))}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-md px-2.5 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-[#3ECF8E]"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Typical UK winter: 30-36 GW
            </span>
          </div>

          {/* Wind Forecast Input/Selector */}
          <div className="p-3 bg-[#171717] rounded-md border border-[#242424]">
            <label className="text-[11px] text-zinc-400 block mb-1.5">
              Expected Wind (P50)
            </label>
            <div className="text-sm font-bold text-[#38BDF8] py-1.5">
              {formatMW(windForecastMW)}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              P10 Floor: {formatMW(calculations.conservativeWind)}
            </span>
          </div>

          {/* Net Shortfall Calculation */}
          <div className="p-3 bg-[#171717] rounded-md border border-[#242424]">
            <label className="text-[11px] text-zinc-400 block mb-1.5">
              Net Thermal Needed (P50)
            </label>
            <div className="text-sm font-bold text-zinc-200 py-1.5">
              {formatMW(calculations.netShortfallP50)}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Demand minus point forecast
            </span>
          </div>

          {/* Final Procurement Recommendation */}
          <div className="p-3 bg-[#171717] rounded-md border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold text-[#3ECF8E] uppercase tracking-wider block">
                Recommended Auction Bid
              </span>
              <div className="text-xl font-bold text-white mt-1">
                {formatMW(
                  riskTolerance === 'p10'
                    ? calculations.netShortfallP10
                    : calculations.netShortfallP50
                )}
              </div>
            </div>
            <span className="text-[10px] text-zinc-400 mt-2 block">
              {riskTolerance === 'p10' ? (
                <span className="text-amber-400">
                  +{formatMW(calculations.recommendedBuffer)} volatility buffer
                </span>
              ) : (
                <span className="text-zinc-500">Exposed to imbalance cash-out</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Probabilistic Confidence Bands Chart */}
      <ConfidenceBands
        forecasts={forecasts.slice(0, 48 * 7)} // First week for clear settlement view
        metrics={metrics}
        errorStats={errorStats}
        isLoading={latestLoading || metricsLoading || distLoading}
      />

      {/* Latest Forecasts Table */}
      <LatestForecastPanel forecasts={forecasts} isLoading={latestLoading} />
    </div>
  )
}
