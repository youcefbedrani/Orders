import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Warm Lead - Pixel Warming Tool',
  description: 'Generate fake purchase events to warm up your Facebook, TikTok, and Google Analytics pixels',
  keywords: ['pixel warming', 'facebook pixel', 'tiktok pixel', 'ad optimization', 'e-commerce'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔥</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
