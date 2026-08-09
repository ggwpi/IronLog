export const ANATOMY_ASSETS = Object.freeze({
  'push-a': Object.freeze({ src: '/assets/anatomy/push-a.webp', width: 309, height: 540 }),
  'legs-a': Object.freeze({ src: '/assets/anatomy/legs-a.webp', width: 559, height: 510 }),
  'pull-a': Object.freeze({ src: '/assets/anatomy/pull-a.webp', width: 268, height: 540 }),
  'push-b': Object.freeze({ src: '/assets/anatomy/push-b.webp', width: 309, height: 540 }),
  'legs-b': Object.freeze({ src: '/assets/anatomy/legs-b.webp', width: 559, height: 510 }),
  arms: Object.freeze({ src: '/assets/anatomy/arms.webp', width: 559, height: 510 }),
});

export function anatomyAsset(id) {
  const asset = ANATOMY_ASSETS[id];
  if (!asset) throw new Error(`Unknown anatomy asset: ${id}`);
  return asset;
}
