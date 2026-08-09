const ASSET_VERSION = '20';
const src = (name) => `/assets/anatomy/${name}.png?v=${ASSET_VERSION}`;

export const ANATOMY_ASSETS = Object.freeze({
  'push-a': Object.freeze({ src: src('push-a'), width: 309, height: 540 }),
  'legs-a': Object.freeze({ src: src('legs-a'), width: 395, height: 360 }),
  'pull-a': Object.freeze({ src: src('pull-a'), width: 268, height: 540 }),
  'push-b': Object.freeze({ src: src('push-b'), width: 309, height: 540 }),
  'legs-b': Object.freeze({ src: src('legs-b'), width: 395, height: 360 }),
  arms: Object.freeze({ src: src('arms'), width: 309, height: 540 }),
});

export function anatomyAsset(id) {
  const asset = ANATOMY_ASSETS[id];
  if (!asset) throw new Error(`Unknown anatomy asset: ${id}`);
  return asset;
}
