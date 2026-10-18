import type { Metadata } from 'next';
import './globals.css';
import './v2-styles.css';
import { I18nProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg' },
  title: 'InmobiliariaPY | Propiedades premium en Paraguay',
  description:
    'Encuentra tu propiedad ideal en Paraguay. Propiedades curadas en las mejores zonas del país.',
  openGraph: {
    title: 'InmobiliariaPY',
    description: 'Mercado inmobiliario premium de Paraguay',
    locale: 'es_PY',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
