// A modal in the browser top layer is painted outside its ancestors' clipping and
// stacking contexts. Raising z-index cannot escape a fixed body's WebKit paint clip.
export function openModalLayer(dialog) {
  if (!dialog) return () => {}
  const active = dialog.ownerDocument?.activeElement
  if (active && !dialog.contains(active) && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))) active.blur?.()
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }
  // Older engines and DOM-only tests retain the existing positioned overlay.
  dialog.setAttribute('open', '')
  return () => dialog.removeAttribute('open')
}
