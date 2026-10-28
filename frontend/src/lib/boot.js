// The complete inline SVG/CSS artwork is visible from the first HTML paint.
// Readiness releases the one-shot intro, then its tiny-logo-to-full-screen reveal.
export function hideBoot() {
  const b = document.getElementById('boot')
  if (!b || b.classList.contains('leaving') || b.classList.contains('out')) return
  b.classList.add('leaving')
  const remove = () => {
    b.dispatchEvent(new Event('ironlog:boot-remove'))
    b.remove()
  }
  const stage = b.querySelector('.boot-stage')
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  if (!stage || reduced) {
    b.classList.add('out')
    setTimeout(remove, 260)
    return
  }
  // Only finish the animation already on screen; late readiness adds no extra intro wait.
  const intro = stage.getAnimations?.().find(a => a.animationName === 'boot-arrive')
  const duration = intro?.effect?.getTiming().duration
  const elapsed = intro?.currentTime
  const remaining = typeof duration === 'number' && typeof elapsed === 'number' ? Math.max(0, duration - elapsed) : 0
  const finish = () => {
    // Vector clipping covers any viewport without allocating a screen-sized scaled bitmap.
    b.style.setProperty('--boot-cover-scale', Math.max(window.innerWidth, window.innerHeight) / 24)
    b.classList.add('finishing')
    setTimeout(() => {
      b.classList.add('out')
      setTimeout(remove, 650)
    }, 220)
  }
  if (remaining) setTimeout(finish, remaining)
  else finish()
}
