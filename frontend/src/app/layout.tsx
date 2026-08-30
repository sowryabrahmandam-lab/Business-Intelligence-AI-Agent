import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skylark Drones — Monday.com BI Executive Agent',
  description: 'AI-Powered Business Intelligence & Decision Support querying live Monday.com Deals and Work Orders',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-slate-900 bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
