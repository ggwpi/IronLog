const ASSET_VERSION = '21';
const src = (name) => `/assets/anatomy/${name}.png?v=${ASSET_VERSION}`;

export const ANATOMY_ASSETS = Object.freeze({
  'push-a': Object.freeze({ src: src('push-a'), width: 105, height: 260 }),
  'legs-a': Object.freeze({ src: src('legs-a'), width: 220, height: 260 }),
  'pull-a': Object.freeze({ src: src('pull-a'), width: 109, height: 260 }),
  'push-b': Object.freeze({ src: src('push-b'), width: 100, height: 260 }),
  'legs-b': Object.freeze({ src: src('legs-b'), width: 206, height: 260 }),
  arms: Object.freeze({ src: src('arms'), width: 199, height: 260 }),
});

export function anatomyAsset(id) {
  const asset = ANATOMY_ASSETS[id];
  if (!asset) throw new Error(`Unknown anatomy asset: ${id}`);
  return asset;
}
