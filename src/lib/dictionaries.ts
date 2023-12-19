import 'server-only'

const dictionaries: { [key: string]: () => Promise<Record<string, string>> } = {
  fi: () => import('../dictionaries/fi.json').then((module) => module.default),
  en: () => import('../dictionaries/en.json').then((module) => module.default),
  'en-FI': () => import('../dictionaries/en.json').then((module) => module.default),
  'en-US': () => import('../dictionaries/en.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  return dictionaries[locale]()
};