import { Component, useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ShimmeringText } from '@animate-ui/react/primitives/texts/shimmering'
const lightning = `${import.meta.env.BASE_URL}ironlog-lightning.svg`

function Artwork({ boot }) {
  useLayoutEffect(() => {
    boot.dataset.enhanced = 'true'
    return () => boot.removeAttribute('data-enhanced')
  }, [boot])
  return <div className="boot-stage">
    <div className="boot-mark">
      <img className="boot-static-bolt" src={lightning} alt="" />
    </div>
    <ShimmeringText className="boot-wordmark" text="IronLog" duration={1.2}
      color="#a1a1aa" shimmeringColor="#ffffff" wave={false} />
  </div>
}

class SafeArtwork extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.boot.removeAttribute('data-enhanced') }
  render() { return this.state.failed ? null : this.props.children }
}

export function mountBoot() {
  const boot = document.getElementById('boot')
  const host = document.getElementById('boot-enhancement')
  if (!boot || !host || boot.classList.contains('out')) return
  const root = createRoot(host)
  boot.addEventListener('ironlog:boot-remove', () => root.unmount(), { once: true })
  root.render(<SafeArtwork boot={boot}><Artwork boot={boot} /></SafeArtwork>)
}
