import { GasForm } from '@/app/[locale]/GasForm';
import { getDictionary } from '../../lib/dictionaries';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ModeToggle } from '@/components/ModeToggle';
const JSDom = require('jsdom');
const { JSDOM } = JSDom;

type NextPage = {
  params: {
    locale: string;
  };
};

export default async function Home({ params: { locale } }: NextPage) {
  const dictionary = await getDictionary(locale);
  const averageGasPrice = await getFinlandsAverageGasPrice();

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-8 gap-4">
      <header className="flex justify-between w-[600px] max-w-[100%]">
        <LanguageSwitcher
          locale={locale}
          // className="absolute right-2 top-2"
        />
        <h1 className="text-3xl font-bold mb-4 inline-block">
          {dictionary.title}
        </h1>
        <ModeToggle
          dictionary={dictionary}
          // className="absolute left-2 top-2"
        />
      </header>

      <GasForm
        dictionary={dictionary}
        locale={locale}
        averageGasPrice={averageGasPrice}
      />
    </main>
  );
}

export type FinlandAverageGasPrice = {
  helsinki: number | null;
  finland: number | null;
} | null;

/**
 * Fetches Finland's average gas price from tankille.fi website.
 *
 * @returns FinlandAverageGasPrice
 */
async function getFinlandsAverageGasPrice(): Promise<FinlandAverageGasPrice> {
  const CACHE_PRODUCTION_TIME = 60 * 60 * 8; // 8 hours
  const CACHE_DEVELOPMENT_TIME = 60; // 5 seconds

  try {
    const responseHelsinki = await fetch('https://www.tankille.fi/helsinki/', {
      next: {
        revalidate:
          process.env.NODE_ENV === 'production'
            ? CACHE_PRODUCTION_TIME
            : CACHE_DEVELOPMENT_TIME,
      },
    });

    const responseFinland = await fetch('https://www.tankille.fi/suomi/', {
      next: {
        revalidate:
          process.env.NODE_ENV === 'production'
            ? CACHE_PRODUCTION_TIME
            : CACHE_DEVELOPMENT_TIME,
      },
    });

    if (!responseHelsinki.ok && !responseFinland.ok) {
      throw new Error('Failed to fetch data');
    }

    const helsinkiHtmlContent = await responseHelsinki.text();
    const domHelsinki = new JSDOM(helsinkiHtmlContent);

    const finlandHtmlContent = await responseFinland.text();
    const domFinland = new JSDOM(finlandHtmlContent);

    const helsinkiDomElementWithAvgPrice = findElementWithText(
      domHelsinki.window.document,
      'Keskiarvo',
      'h6'
    );

    const finlandDomElementWithAvgPrice = findElementWithText(
      domFinland.window.document,
      'Keskiarvo',
      'h6'
    );

    const helsinkiAvgPrice = getPriceFromDomElement(
      helsinkiDomElementWithAvgPrice
    );

    const finlandAvgPrice = getPriceFromDomElement(
      finlandDomElementWithAvgPrice
    );

    if (!helsinkiAvgPrice && !finlandAvgPrice) return null;

    return {
      helsinki: helsinkiAvgPrice,
      finland: finlandAvgPrice,
    };
  } catch (error) {
    console.error('Error fetching and parsing data:', error);
    return null;
  }
}

/**
 * Helper function to get price from a dom element. Works on tankille.fi website.
 *
 * @param domElement
 * @returns number | null
 */
function getPriceFromDomElement(domElement: Element | null) {
  if (!domElement) return null;

  const priceText = domElement.innerHTML || '';
  const trimmedPriceText = priceText.replace(/(\r\n|\n|\r|\t)/gm, '');
  const price = trimmedPriceText.split(' ').filter(Boolean)[1];

  return parseFloat(price);
}

/**
 * Helper function to find certain html element with a specific text content.
 *
 * @param doc
 * @param text
 * @param htmlTag
 * @returns Element | null
 */
function findElementWithText(
  doc: Document,
  text: string,
  htmlTag: string = 'p'
) {
  const elements = doc.getElementsByTagName(htmlTag);

  for (const element of elements) {
    if (element.textContent?.includes(text)) {
      return element;
    }
  }

  return null;
}
