import { resetLegacyData } from './lib/cloud-reset.js'
import { hideBoot } from './lib/boot.js'
const MOBILE = import.meta.env.VITE_MOBILE === '1'

// Only presentation code: this enhancement does not read a profile or delay boot.
// Artwork stays hidden until the effect is ready; app readiness always wins.
import('./boot/start.jsx').then(({ mountBoot }) => mountBoot()).catch(() => {})

// No module that reads a profile is imported until the authorized reset completes.
resetLegacyData({ native: MOBILE }).then(() => import('./app-entry.jsx')).catch(error => {
  const root = document.getElementById('root')
  const message = document.createElement('p')
  message.textContent = 'לא ניתן להשלים את איפוס הנתונים. סגרו חלונות אחרים של IronLog ופתחו שוב.'
  message.dir = 'rtl'
  root.replaceChildren(message)
  hideBoot()
  console.error('IronLog reset could not complete', error.name)
})
