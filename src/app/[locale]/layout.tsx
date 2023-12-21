import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getDictionary } from '@/lib/dictionaries';

const montserrat = Montserrat({ subsets: ['latin'] });

type Props = {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale = 'en' } = params;
  const dictionary = await getDictionary(locale);
  const title = dictionary.title;
  const appDescription = dictionary.appDescription;

  return {
    title,
    description: appDescription,
    manifest: '/manifest.json',
    authors: {
      name: 'Joel Lappalainen',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#ced080',
};

export async function generateStaticParams() {
  return [{ locale: 'fi' }, { locale: 'en' }];
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale} suppressHydrationWarning>
      <body className={montserrat.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
