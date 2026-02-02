import './globals.css';
import type { Metadata } from 'next';
import { ServiceWorkerRegister } from '../components/ServiceWorkerRegister';
import { RumProvider } from '../components/RumProvider';

export const metadata: Metadata = {
  title: 'Romuo — VTC Premium Suisse',
  description: 'Réservez votre VTC premium en Suisse en moins de 30 secondes.',
  metadataBase: new URL('https://romuo.ch'),
  openGraph: {
    title: 'Romuo — VTC Premium Suisse',
    description: 'Réservez votre VTC premium en Suisse en moins de 30 secondes.',
    url: 'https://romuo.ch',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://app.romuo.ch" />
        <link rel="dns-prefetch" href="https://app.romuo.ch" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
      </head>
      <body>
        <RumProvider>
          {children}
          <ServiceWorkerRegister />
        </RumProvider>
      </body>
    </html>
  );
}
