import type { PrivateContentModule } from '@/types/content';

export const hasPrivateContent = false;
export const privateContentMeta: PrivateContentModule['privateContentMeta'] = {
  generatedAt: null,
  sourcePdf: null,
  notes: 'Kein lokales Buchmaterial importiert.',
};
export const audioModules: Record<string, number> = {};
export const unitSeedBundle = null;
export const unitSeedBundles = [];
