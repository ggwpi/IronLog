// A transition may finish on the compositor while React, fonts or the first exercise image
// are still loading. Reveal only after the destination has settled for two paint frames.
export function waitForScreenReady(findScreen, { timeout = 8000 } = {}) {
  return new Promise(resolve => {
    let frame, previous, signature, stable = 0, done = false
    const decoded = new Map()
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(deadline)
      window.cancelAnimationFrame(frame)
      resolve()
    }
    // A failed/unreachable asset must never trap the user behind the transition.
    const deadline = setTimeout(finish, timeout)
    const visible = el => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth
    }
    const check = () => {
      if (done) return
      const screen = findScreen()
      if (screen) {
        const media = [...screen.querySelectorAll('img,video')].filter(visible)
        const sources = media.map(el => el.currentSrc || el.src).join('|')
        const loading = media.some(el => {
          if (el.tagName === 'VIDEO') return !el.error && el.readyState < 2
          if (!el.complete) return true
          if (!el.naturalWidth || !el.decode) return false
          const src = el.currentSrc || el.src
          let entry = decoded.get(el)
          if (!entry || entry.src !== src) {
            entry = { src, ready: false }
            decoded.set(el, entry)
            Promise.resolve().then(() => el.decode()).catch(() => {}).then(() => { entry.ready = true })
          }
          return !entry.ready
        })
        const entering = screen.getAnimations?.({ subtree: true }).some(a =>
          (a.playState === 'running' || a.pending) && Number.isFinite(a.effect?.getTiming().iterations ?? 1))
        const ready = !loading && !entering && document.fonts?.status !== 'loading'
        stable = ready && screen === previous && sources === signature ? stable + 1 : 0
        previous = screen
        signature = sources
        if (stable >= 2) { finish(); return }
      } else { previous = null; stable = 0 }
      frame = window.requestAnimationFrame(check)
    }
    frame = window.requestAnimationFrame(check)
  })
}

export function waitForWorkoutScreen(id) {
  return waitForScreenReady(() => {
    const page = document.querySelector('#app > .page[data-path="/workout"]:not(.under)')
    if (id && page?.querySelector('[data-workout-id]')?.getAttribute('data-workout-id') !== String(id)) return null
    return page
  })
}
