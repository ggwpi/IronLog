import { escapeHtml } from '../core/escape-html.js';
import { anatomyAsset } from '../assets/anatomy-assets.js';

export function AnatomyVisual({ assetId, label = '' } = {}) {
  const asset = anatomyAsset(assetId);
  const safeLabel = escapeHtml(label || assetId);

  return `<figure class="anatomy-visual" aria-label="${safeLabel}">
    <img
      class="anatomy-visual__image"
      src="${asset.src}"
      width="${asset.width}"
      height="${asset.height}"
      alt="${safeLabel}"
      loading="eager"
      fetchpriority="high"
    >
  </figure>`;
}
