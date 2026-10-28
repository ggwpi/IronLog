// The splash's vector wipe, starting at the pressed control. No session or routing state lives
// here: the caller's original action runs once, after the screen is fully covered. It may
// return a readiness promise; keep the cover until the destination is ready to be revealed.
let active = null
let sequence = 0
const BOLT = 'M302 75 147 310h101l-39 127 166-241H274L302 75Z'

export function lightningTransition(source, action) {
  if (active) return active
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || typeof source?.animate !== 'function') {
    action()
    return () => {}
  }

  const box = source.getBoundingClientRect()
  const x = box.left + box.width / 2
  const y = box.top + box.height / 2
  const id = `lightning-cover-${++sequence}`
  const screen = document.createElement('div')
  screen.className = 'lightning-screen lightning-action'
  screen.setAttribute('aria-hidden', 'true')
  screen.style.setProperty('--lightning-clip', `url(#${id})`)
  screen.innerHTML = `<svg class="boot-defs" focusable="false"><defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${BOLT}"/></clipPath></defs></svg><div class="boot-wipe"></div><svg class="lightning-hold" viewBox="140 70 240 372" focusable="false"><path d="${BOLT}"/></svg>`
  document.body.appendChild(screen)

  let grow, fade, iris, ink, inkFade, committed = false, closed = false
  const cleanup = () => {
    if (closed) return
    closed = true
    for (const animation of [grow, fade, iris, ink, inkFade]) animation?.cancel()
    screen.remove()
    if (active === cancel) active = null
  }
  const commit = () => {
    if (closed || committed) return
    committed = true
    try { return action() } catch (error) { cleanup(); throw error }
  }
  const cancel = () => { if (!committed) cleanup() }
  active = cancel

  const revealFromLogo = (box, opacity) => {
    const ns = 'http://www.w3.org/2000/svg'
    const startScale = box.width / 240
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2
    const extent = Math.max(window.innerWidth, window.innerHeight) * 2 / startScale
    const clip = document.createElementNS(ns, 'clipPath')
    clip.id = `${id}-reveal`
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse')
    const hole = document.createElementNS(ns, 'path')
    // One even-odd vector path: the page shows through the expanding lightning-shaped hole.
    // Scaling the SVG geometry keeps the reveal sharp without growing a giant bitmap mask.
    hole.setAttribute('d', `M-${extent} -${extent}H${extent}V${extent}H-${extent}Z ${BOLT}`)
    hole.setAttribute('clip-rule', 'evenodd')
    clip.appendChild(hole)
    screen.querySelector('defs').appendChild(clip)

    const logo = document.createElementNS(ns, 'svg')
    logo.setAttribute('class', 'lightning-iris')
    logo.setAttribute('focusable', 'false')
    const white = document.createElementNS(ns, 'path')
    white.setAttribute('d', BOLT)
    logo.appendChild(white)
    screen.appendChild(logo)

    const centered = scale => `translate(${cx}px,${cy}px) scale(${scale}) translate(-260px,-256px)`
    const w = window.innerWidth, h = window.innerHeight
    // The bolt contains a 48-unit circle around its centre. Fit the farthest corner rather
    // than overshooting: the logo remains recognisable throughout its zoom.
    const endScale = Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy)) / 48
    const keyframes = [
      { transform: centered(startScale), offset: 0 },
      { transform: centered(startScale + (endScale - startScale) * .12), offset: .65 },
      { transform: centered(endScale), offset: 1 },
    ]
    const timing = { duration: 380, easing: 'cubic-bezier(.7,0,.85,.3)', fill: 'forwards' }
    hole.style.transform = white.style.transform = centered(startScale)
    screen.style.setProperty('--lightning-clip', `url(#${clip.id})`)
    iris = hole.animate(keyframes, timing)
    ink = white.animate(keyframes, timing)
    inkFade = white.animate([{ opacity }, { opacity: 0 }], { duration: 90, fill: 'forwards' })
    ink.finished.catch(() => {})
    inkFade.finished.catch(() => {})
    iris.finished.then(cleanup, cleanup)
  }

  const transform = scale => `translate(${x}px,${y}px) scale(${scale}) translate(-260px,-256px)`
  // Generous coverage also allows for toolbar changes and rotation during the short wipe.
  const scale = Math.max(window.innerWidth, window.innerHeight) / 16
  try {
    grow = screen.querySelector('path').animate([
      { transform: transform(.075) }, { transform: transform(scale) },
    ], { duration: 380, easing: 'cubic-bezier(.65,0,.8,.3)', fill: 'forwards' })
  } catch {
    cleanup()
    action()
    return () => {}
  }
  grow.finished.then(async () => {
    if (closed) return
    screen.classList.add('waiting')
    // React navigation and visible media readiness are independent of the wipe's duration.
    const ready = commit()
    if (ready?.then) await ready
    const hold = screen.querySelector('.lightning-hold')
    const opacity = Number(window.getComputedStyle(hold).opacity)
    const logoBox = hold.getBoundingClientRect()
    screen.classList.remove('waiting')
    try {
      if (opacity > .01 && logoBox.width > 0 && logoBox.height > 0) {
        revealFromLogo(logoBox, opacity)
        return
      }
      fade = screen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'ease-out', fill: 'forwards' })
      fade.finished.then(cleanup, cleanup)
    } catch { cleanup() }
  }, () => {
    // If the browser cancels the effect, the control must still perform its action.
    if (!closed) { try { commit() } finally { cleanup() } }
  }).catch(error => { cleanup(); console.error('IronLog screen transition failed', error) })

  // Route/auth changes before coverage cancel pending work. Once committed, let the reveal
  // finish even if the destination unmounts the navigation bar.
  return cancel
}
