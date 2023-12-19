const locales = ['fi', 'en', 'en-FI', 'en-US'];
const defaultLocale = 'fi';

function getLocale(request: any) {
  const localeFromHeader = request.headers.get('Accept-Language');

  if (localeFromHeader) {
    const locale = localeFromHeader.split(',')[0];
    if (locales.includes(locale)) return locale;
  }
  return defaultLocale;
}

export default function middleware(request: any) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  console.log(pathname);
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect if there is no locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  return Response.redirect(request.nextUrl);
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
};
