// Freeze application content, never the viewport's body. Overlays are portalled
// alongside #root so WebKit cannot crop them with the frozen page's paint layer.
export const pageRoot = (doc = document) => doc.getElementById?.('root') || doc.body
export function pinnedPageStyle(win = window) {
  const root = pageRoot(win.document)
  return root?.style.position === 'fixed' ? root.style : null
}
export const pageIsPinned = (win = window) => !!pinnedPageStyle(win)

export function lockPage(win = window) {
  const root = pageRoot(win.document)
  const style = root.style
  const fields = ['position', 'top', 'left', 'right', 'width']
  const before = Object.fromEntries(fields.map(k => [k, style[k] || '']))
  const wasInert = root.hasAttribute?.('inert')
  // Read before fixing the root: removing it from flow can synchronously reset scrollY.
  const y = win.scrollY || 0
  style.position = 'fixed'; style.top = -y + 'px'
  style.left = '0'; style.right = '0'; style.width = '100%'
  if (root !== win.document.body) root.setAttribute('inert', '')
  let released = false
  return { style, release() {
    if (released) return
    released = true
    for (const field of fields) style[field] = before[field]
    if (!wasInert && root !== win.document.body) root.removeAttribute('inert')
  } }
}
