const ASSET_VERSION = '23';
const src = (name) => `/assets/anatomy/${name}.svg?v=${ASSET_VERSION}`;

export const ANATOMY_ASSETS = Object.freeze({
  'push-a': Object.freeze({ src: src('push-a'), width: 720, height: 980 }),
  'legs-a': Object.freeze({ src: src('legs-a'), width: 720, height: 980 }),
  'pull-a': Object.freeze({ src: src('pull-a'), width: 720, height: 980 }),
  'push-b': Object.freeze({ src: src('push-b'), width: 720, height: 980 }),
  'legs-b': Object.freeze({ src: `/assets/anatomy/legs-b-original.svg?v=${ASSET_VERSION}`, width: 580, height: 530 }),
  arms: Object.freeze({ src: src('arms'), width: 720, height: 980 }),
});

export function anatomyAsset(id) {
  const asset = ANATOMY_ASSETS[id];
  if (!asset) throw new Error(`Unknown anatomy asset: ${id}`);
  return asset;
}
