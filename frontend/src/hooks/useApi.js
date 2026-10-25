import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

// Fetch actual generation data
export function useActuals(params = {}) {
  return useQuery({
    queryKey: ['actuals', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/actuals', { params })
      return data
    },
  })
}

// Fetch forecast data
export function useForecasts(params = {}) {
  return useQuery({
    queryKey: ['forecasts', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/forecasts', { params })
      return data
    },
  })
}

// Fetch latest forecasts
export function useLatestForecasts() {
  return useQuery({
    queryKey: ['forecasts', 'latest'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/forecasts/latest')
      return data
    },
  })
}

// Fetch accuracy metrics
export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/metrics')
      return data
    },
  })
}

// Fetch forecast vs actual comparison data
export function useForecastVsActual(params = {}) {
  return useQuery({
    queryKey: ['analysis', 'forecast-vs-actual', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/analysis/forecast-vs-actual', { params })
      return data
    },
  })
}

// Fetch horizon analysis
export function useHorizonAnalysis() {
  return useQuery({
    queryKey: ['analysis', 'horizon'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/analysis/horizon')
      return data
    },
  })
}

// Fetch hourly error analysis
export function useHourlyErrors() {
  return useQuery({
    queryKey: ['analysis', 'hourly-errors'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/analysis/hourly-errors')
      return data
    },
  })
}

// Fetch error distribution
export function useErrorDistribution() {
  return useQuery({
    queryKey: ['analysis', 'error-distribution'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/analysis/error-distribution')
      return data
    },
  })
}

// Fetch daily metrics
export function useDailyMetrics() {
  return useQuery({
    queryKey: ['analysis', 'daily-metrics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/analysis/daily-metrics')
      return data
    },
  })
}

// Fetch rolling accuracy
export function useRollingAccuracy() {
  return useQuery({
    queryKey: ['analysis', 'rolling-accuracy'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/analysis/rolling-accuracy')
      return data
    },
  })
}
