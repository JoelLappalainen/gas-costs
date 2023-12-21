import Link from 'next/link';
import { Button } from './ui/button';
import Image from 'next/image';

function LanguageSwitcher({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const nextLocale = locale === 'en' ? 'fi' : 'en';

  return (
    <Link href={`/${nextLocale}`} className={className}>
      <Button size={'icon'} variant="outline" className="capitalize">
        {nextLocale === 'fi' ? (
          <Image
            src="/icons/flagFinland.svg"
            width={20}
            height={10}
            alt="Finnish flag"
          />
        ) : (
          <Image
            src="/icons/flagUnitedKindom.svg"
            width={20}
            height={10}
            alt="British flag"
          />
        )}
      </Button>
    </Link>
  );
}

export default LanguageSwitcher;
