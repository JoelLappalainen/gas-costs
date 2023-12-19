import Link from 'next/link';
import { Button } from './ui/button';

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
        {nextLocale}
      </Button>
    </Link>
  );
}

export default LanguageSwitcher;
