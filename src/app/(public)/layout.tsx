import type { Metadata } from 'next';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { LiveActivityPulse } from '@/components/common/LiveActivityPulse';

export const metadata: Metadata = {
  title: {
    template: '%s | Union Verify',
    default: 'Union Verify — Building Wealth Together',
  },
  description:
    'Union Verify is a marriage investment platform helping couples build long-term financial wealth through structured, transparent investment opportunities.',
  keywords: [
    'marriage investment',
    'couples investing',
    'union verify',
    'joint investment platform',
    'financial planning couples',
  ],
  openGraph: {
    siteName: 'Union Verify',
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
      <LiveActivityPulse />
    </div>
  );
}
