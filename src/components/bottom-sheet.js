let sheetSequence = 0;

function viewportMetrics() {
  const viewport = window.visualViewport;
  return {
    left: Math.max(0, viewport?.offsetLeft ?? 0),
    top: Math.max(0, viewport?.offsetTop ?? 0),
    width: Math.max(1, viewport?.width ?? document.documentElement.clientWidth ?? window.innerWidth),
    height: Math.max(1, viewport?.height ?? window.innerHeight),
  };
}

export function createBottomSheet({
  ariaLabel = 'חלונית',
  layerClassName = '',
  panelClassName = '',
  content = '',
} = {}) {
  const layer = document.createElement('div');
  const id = `ironlog-bottom-sheet-${++sheetSequence}`;
  layer.className = ['app-bottom-sheet-layer', layerClassName].filter(Boolean).join(' ');
  layer.hidden = true;
  layer.setAttribute('aria-hidden', 'true');
  layer.dataset.bottomSheetLayer = id;
  layer.innerHTML = `<section class="app-bottom-sheet ${panelClassName}" role="dialog" aria-modal="true" aria-label="${String(ariaLabel).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}">${content}</section>`;
  document.body.appendChild(layer);

  const panel = layer.querySelector('.app-bottom-sheet');
  let hideTimer = 0;
  let listenersBound = false;

  const syncViewport = () => {
    if (!layer.isConnected) return;
    const metrics = viewportMetrics();
    layer.style.setProperty('--bottom-sheet-left', `${metrics.left}px`);
    layer.style.setProperty('--bottom-sheet-top', `${metrics.top}px`);
    layer.style.setProperty('--bottom-sheet-width', `${metrics.width}px`);
    layer.style.setProperty('--bottom-sheet-height', `${metrics.height}px`);
  };

  const bindViewport = () => {
    if (listenersBound) return;
    listenersBound = true;
    window.visualViewport?.addEventListener('resize', syncViewport, { passive: true });
    window.visualViewport?.addEventListener('scroll', syncViewport, { passive: true });
    window.addEventListener('resize', syncViewport, { passive: true });
    window.addEventListener('orientationchange', syncViewport, { passive: true });
  };

  const unbindViewport = () => {
    if (!listenersBound) return;
    listenersBound = false;
    window.visualViewport?.removeEventListener('resize', syncViewport);
    window.visualViewport?.removeEventListener('scroll', syncViewport);
    window.removeEventListener('resize', syncViewport);
    window.removeEventListener('orientationchange', syncViewport);
  };

  const open = () => {
    window.clearTimeout(hideTimer);
    syncViewport();
    bindViewport();
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      syncViewport();
      layer.classList.add('is-open');
    });
  };

  const close = ({ immediate = false } = {}) => {
    window.clearTimeout(hideTimer);
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    if (layer.contains(document.activeElement)) document.activeElement?.blur?.();
    const finish = () => {
      layer.hidden = true;
      unbindViewport();
    };
    if (immediate) finish();
    else hideTimer = window.setTimeout(finish, 230);
  };

  const destroy = () => {
    window.clearTimeout(hideTimer);
    unbindViewport();
    layer.remove();
  };

  return {
    root: layer,
    panel,
    open,
    close,
    destroy,
    syncViewport,
    isOpen: () => !layer.hidden && layer.classList.contains('is-open'),
  };
}
