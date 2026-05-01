import {
  audioModules,
  hasPrivateContent,
  privateContentMeta,
  unitSeedBundle,
  unitSeedBundles,
} from '@/private-content/runtime';

import type { PrivateContentModule } from '@/types/content';

const loadedModule = {
  audioModules,
  hasPrivateContent,
  privateContentMeta,
  unitSeedBundle,
  unitSeedBundles,
} as PrivateContentModule;

export function getPrivateSeedBundle() {
  return loadedModule.unitSeedBundle;
}

export function getPrivateSeedBundles() {
  if (loadedModule.unitSeedBundles?.length) {
    return loadedModule.unitSeedBundles;
  }

  return loadedModule.unitSeedBundle ? [loadedModule.unitSeedBundle] : [];
}

export function getPrivateContentMeta() {
  return loadedModule.privateContentMeta;
}

export function privateContentIsAvailable() {
  return loadedModule.hasPrivateContent;
}

export function getAudioModule(assetKey: string) {
  return loadedModule.audioModules[assetKey];
}
