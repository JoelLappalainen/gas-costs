import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Split Gasoline Costs',
  description: 'Web app to calculate and split gas prices.',
  manifest: '/manifest.json',
  authors: {
    name: 'Joel Lappalainen',
  },
};

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
      <body className={inter.className}>
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
