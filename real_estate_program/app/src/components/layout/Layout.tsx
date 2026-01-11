import { FC, ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface Props {
  children: ReactNode;
}

export const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen bg-solana-dark-950">
      {/* Background gradient effects - Raydium style */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Top right purple orb */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-solana-purple-500/15 rounded-full blur-[100px] float-orb" />
        {/* Left green orb */}
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-solana-green-500/10 rounded-full blur-[100px] float-orb-delayed" />
        {/* Bottom center purple orb */}
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-solana-purple-500/10 rounded-full blur-[100px] float-orb-slow" />
        {/* Mid-right green accent */}
        <div className="absolute top-2/3 right-1/4 w-64 h-64 bg-solana-green-500/5 rounded-full blur-[80px] float-orb-delayed" />
        {/* Grid overlay for texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />
      </div>

      <Header />

      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
