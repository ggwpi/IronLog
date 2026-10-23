import { navigationBottom } from './navigation-viewport.js'

// Modal bounds must not depend on the dock being mounted. On installed iOS,
// Safari's layout viewport can end above the actual app window, even after launch.
export function modalViewport(win) {
  const installed = win.navigator?.standalone || win.matchMedia?.('(display-mode: standalone)').matches
  const height = installed ? navigationBottom(win) : win.innerHeight
  if (!(height > 0)) return null
  const visual = win.visualViewport
  const visualHeight = visual?.height || height
  const visualTop = visual?.offsetTop || 0
  // A small mismatch is browser chrome / stale safe-area measurement, not a keyboard.
  const keyboard = height - (visualTop + visualHeight) > 100
  return {
    height,
    bottom: keyboard ? Math.max(0, height - visualTop - visualHeight) : 0,
    available: keyboard ? visualHeight : height,
    top: keyboard ? visualTop : 0,
  }
}

export function startModalViewport(element, win = window) {
  if (!element) return () => {}
  let frame = 0
  const properties = ['--modal-height', '--modal-keyboard-bottom', '--modal-available-height', '--modal-content-top']
  const sync = () => {
    frame = 0
    const bounds = modalViewport(win)
    if (!bounds) return
    const values = [bounds.height, bounds.bottom, bounds.available, bounds.top]
    properties.forEach((name, i) => element.style.setProperty(name, values[i] + 'px'))
  }
  const schedule = () => {
    if (!frame) frame = win.requestAnimationFrame?.(sync) || 0
  }
  sync()
  schedule()
  const timers = [win.setTimeout?.(schedule, 250), win.setTimeout?.(schedule, 1000)]
  const targets = [[win, 'resize'], [win, 'orientationchange'], [win, 'pageshow'],
    [win.visualViewport, 'resize'], [win.visualViewport, 'scroll'],
    [win.document, 'focusin'], [win.document, 'focusout']]
  for (const [target, event] of targets) target?.addEventListener?.(event, schedule)
  return () => {
    for (const timer of timers) if (timer != null) win.clearTimeout?.(timer)
    if (frame) win.cancelAnimationFrame?.(frame)
    for (const [target, event] of targets) target?.removeEventListener?.(event, schedule)
    for (const name of properties) element.style.removeProperty(name)
  }
}
