import type { Metadata } from 'next';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

export const metadata: Metadata = {
  title: {
    template: '%s | Union Invest',
    default: 'Union Invest — Building Wealth Together',
  },
  description:
    'Union Invest is a marriage investment platform helping couples build long-term financial wealth through structured, transparent investment opportunities.',
  keywords: [
    'marriage investment',
    'couples investing',
    'union invest',
    'joint investment platform',
    'financial planning couples',
  ],
  openGraph: {
    siteName: 'Union Invest',
    type: 'website',
  },
};

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      {/* Navbar spacer */}
      <div className="h-16 lg:h-20 flex-shrink-0" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
