import { _setLangState, LANGS, DATE_LOCALES, RTL_LANGS } from './opengym-v145/session-engine/frontend/src/lib/i18n-core.js'
import { t, getLang, dateLocale, RTL_LANGS as ironlogRTL } from './i18n-core.js'
// Locale boundary shared by immutable models, including IronLog's Hebrew dictionary.
export function syncUpstreamLocale() {
  const lang = getLang()
  if (!LANGS[lang]) LANGS[lang] = lang
  DATE_LOCALES[lang] = dateLocale()
  if (ironlogRTL.has(lang)) RTL_LANGS.add(lang)
  _setLangState(lang, new Proxy({}, { get: (_, key) => typeof key === 'string' ? t(key) : undefined }))
}
