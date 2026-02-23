import { ReactNode } from 'react';
import { usePageTransition } from '@/hooks/useGSAP';
import Navbar from './Navbar';
import VantaBackground from './VantaBackground';
import Chatbot from '@/components/chatbot/Chatbot';

interface MainLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showChatbot?: boolean;
}

const MainLayout = ({ children, showNavbar = true, showChatbot = true }: MainLayoutProps) => {

  return (
    <div className="min-h-screen relative">
      <VantaBackground />
      {showNavbar && <Navbar />}
      <main className="relative">
        {children}
      </main>
      {showChatbot && <Chatbot />}
      <footer className="py-12 text-center text-label text-muted-foreground/60">
        © 2026 ALUMNI MANAGEMENT SYSTEM. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
};

export default MainLayout;
