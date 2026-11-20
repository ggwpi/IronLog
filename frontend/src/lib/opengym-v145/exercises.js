// Boundary: use IronLog's catalogue, stable IDs and custom exercise interpretation.
export * from '../exercises.js'
import { EXIDX } from '../exercises.js'
// Original lookup boundary, evaluated against IronLog's catalogue and registered custom IDs.
export const exerciseOf = idOrEx => (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)
