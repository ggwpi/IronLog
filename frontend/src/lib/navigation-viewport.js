// Installed iPhone apps can initially report both viewport heights without the
// bottom inset. Screen dimensions are CSS pixels and independent of that stale
// measurement. Use them only for a standalone window that spans the whole screen;
// ordinary Safari tabs and iPad split-screen keep their visual viewport bounds.
export function navigationBottom(win) {
  const viewport = win.visualViewport
  const visualBottom = (viewport?.offsetTop || 0) + (viewport?.height || win.innerHeight)
  const standalone = win.navigator?.standalone || win.matchMedia?.('(display-mode: standalone)').matches
  if (!standalone) return visualBottom
  let bottom = Math.max(win.innerHeight, visualBottom)
  const ios = /iP(hone|ad|od)/.test(win.navigator?.userAgent || '')
    || (win.navigator?.platform === 'MacIntel' && win.navigator?.maxTouchPoints > 1)
  if (!ios) return bottom
  const screen = win.screen
  if (!(screen?.width > 0 && screen?.height > 0 && win.innerWidth > 0)) return bottom
  const landscape = screen.orientation?.type?.startsWith('landscape')
    || Math.abs(win.orientation || 0) === 90
  const width = landscape ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height)
  const height = landscape ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height)
  if (Math.abs(win.innerWidth - width) <= 2) bottom = Math.max(bottom, height)
  return bottom
}

// Anchor the compact dock to the visible viewport, including Safari's first-load
// viewport correction. Never move it above a keyboard when a text field is focused.
export function startNavigationViewport(element, win = window) {
  if (!element) return () => {}
  let frame = 0, stableBottom = 0
  const sync = () => {
    frame = 0
    const bottom = navigationBottom(win)
    if (!(bottom > 0)) return
    const focused = win.document.activeElement
    const editing = focused?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(focused?.tagName || '')
    if (editing && stableBottom && bottom < stableBottom - 100) return
    stableBottom = bottom
    element.style.setProperty('--navigation-viewport-bottom', bottom + 'px')
    const standalone = win.navigator?.standalone || win.matchMedia?.('(display-mode: standalone)').matches
    const pageStyle = win.document.documentElement?.style
    if (standalone) pageStyle?.setProperty('--navigation-installed-height', bottom + 'px')
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
    win.document.documentElement?.style.removeProperty('--navigation-installed-height')
  }
}
