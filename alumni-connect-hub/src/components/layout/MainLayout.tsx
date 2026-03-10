import { ReactNode } from 'react';
import Navbar from './Navbar';
import VantaBackground from './VantaBackground';

interface MainLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

const MainLayout = ({ children, showNavbar = true }: MainLayoutProps) => {

  return (
    <div className="min-h-screen relative">
      <VantaBackground />
      {showNavbar && <Navbar />}
      <main className="relative">
        {children}
      </main>
      <footer className="py-12 text-center text-label text-muted-foreground/60">
        © 2026 ALUMNI MANAGEMENT SYSTEM. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
};

export default MainLayout;
