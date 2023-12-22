import Link from 'next/link';
import { Button } from './ui/button';
import Image from 'next/image';
import { getDictionary } from '@/lib/dictionaries';

async function LanguageSwitcher({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const dictionary = await getDictionary(locale);
  const nextLocale = locale === 'en' ? 'fi' : 'en';

  return (
    <Link href={`/${nextLocale}`} className={className}>
      <Button
        size={'icon'}
        variant="outline"
        className="capitalize"
        aria-label={`${dictionary.changeLanguageTo} ${dictionary[nextLocale]}`}
      >
        {nextLocale === 'fi' ? (
          <Image
            src="/icons/flagFinland.svg"
            width={18}
            height={11}
            alt="Finnish flag"
          />
        ) : (
          <Image
            src="/icons/flagUnitedKindom.svg"
            width={20}
            height={12}
            alt="British flag"
          />
        )}
      </Button>
    </Link>
  );
}

export default LanguageSwitcher;
