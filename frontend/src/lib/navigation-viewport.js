// Anchor the compact dock to the visible viewport, including Safari's first-load
// viewport correction. Never move it above a keyboard when a text field is focused.
export function startNavigationViewport(element, win = window) {
  if (!element) return () => {}
  let frame = 0, stableBottom = 0
  const sync = () => {
    frame = 0
    const viewport = win.visualViewport
    const visualBottom = (viewport?.offsetTop || 0) + (viewport?.height || win.innerHeight)
    const standalone = win.navigator?.standalone || win.matchMedia?.('(display-mode: standalone)').matches
    const bottom = standalone ? Math.max(win.innerHeight, visualBottom) : visualBottom
    if (!(bottom > 0)) return
    const focused = win.document.activeElement
    const editing = focused?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(focused?.tagName || '')
    if (editing && stableBottom && bottom < stableBottom - 100) return
    stableBottom = bottom
    element.style.setProperty('--navigation-viewport-bottom', bottom + 'px')
  }
  const schedule = () => {
    if (!frame) frame = win.requestAnimationFrame(sync)
  }
  // Layout-effect caller measures before paint; the next frame also catches the
  // viewport settling after a cold launch, without requiring a route change.
  sync()
  schedule()
  const startup = [win.setTimeout(schedule, 250), win.setTimeout(schedule, 1000)]
  const targets = [[win,'resize'],[win,'orientationchange'],[win,'pageshow'],[win,'load'],
    [win.visualViewport,'resize'],[win.visualViewport,'scroll'],[win.document,'focusout']]
  for (const [target,event] of targets) target?.addEventListener(event,schedule)
  return () => {
    for (const timer of startup) win.clearTimeout(timer)
    if (frame) win.cancelAnimationFrame(frame)
    for (const [target,event] of targets) target?.removeEventListener(event,schedule)
    element.style.removeProperty('--navigation-viewport-bottom')
  }
}
