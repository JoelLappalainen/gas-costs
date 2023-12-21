import 'server-only';
import { Dictionary } from '../dictionaries/en';

const dictionaries: { [key: string]: () => Promise<Dictionary> } = {
  fi: () => import('../dictionaries/fi').then((module) => module.default),
  en: () => import('../dictionaries/en').then((module) => module.default),
  'en-FI': () => import('../dictionaries/en').then((module) => module.default),
  'en-US': () => import('../dictionaries/en').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  return dictionaries[locale]();
};
