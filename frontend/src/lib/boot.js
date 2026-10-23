// The complete inline SVG/CSS artwork is visible from the first HTML paint.
// It goes the moment the app can draw, or on a script error before that, so it never lifts forever.
export function hideBoot() {
  const b = document.getElementById('boot')
  if (!b || b.classList.contains('out')) return
  b.classList.add('out')
  setTimeout(() => {
    b.dispatchEvent(new Event('ironlog:boot-remove'))
    b.remove()
  }, 260)
}
