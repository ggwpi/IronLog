import { useMemo } from 'react'
import BodyMap from './BodyMap.jsx'
import { loadOfRoutine } from '../lib/muscles.js'
import './MiniBodyMap.css'

// Upstream v1.4.5 planned-session thumbnail, using IronLog's own body geometry,
// muscle catalogue, palette, and existing today-row treatment. No profile writes.
export function previewMuscleLoad(routines) {
  const exercises = (routines || []).flatMap(r => Array.isArray(r?.ex) ? r.ex : [])
  return loadOfRoutine({ ex: exercises })
}

export default function MiniBodyMap({ routines, body }) {
  const load = useMemo(() => previewMuscleLoad(routines), [routines])
  if (!Object.values(load).some(value => value > 0)) return null
  return <span className="ironlog-mini-body-map" data-workout-muscle-preview aria-hidden="true">
    <BodyMap load={load} body={body} />
  </span>
}
