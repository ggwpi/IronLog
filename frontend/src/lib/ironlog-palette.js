import { DEFAULT_ACCENT } from './accent.js'

// Apply the requested upstream palette once; later Settings choices remain valid.
export function restoreUpstreamPalette(state) {
  if (state.ironlogPaletteVersion >= 1) return false
  state.theme = 'dark'
  state.accent = DEFAULT_ACCENT
  delete state.accentCustom
  state.ironlogPaletteVersion = 1
  return true
}
