import createPlotComponent from 'react-plotly.js/factory'

const Plotly = typeof window !== 'undefined' && window.Plotly ? window.Plotly : {}
const factory = createPlotComponent.default || createPlotComponent
const Plot = factory(Plotly)

export default Plot
