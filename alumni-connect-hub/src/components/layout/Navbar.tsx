import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavbarScroll } from '@/hooks/useGSAP';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useNavbarScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/events', label: 'Events' },
    { path: '/jobs', label: 'Jobs' },
    ...(isAuthenticated && user?.role === 'student' ? [
      { path: '/matching', label: 'Find Mentors' },
      { path: '/connections', label: 'Connections' }
    ] : []),
    ...(isAuthenticated && user?.role === 'alumni' ? [
      { path: '/connections', label: 'Connections' }
    ] : []),
  ];

  const getDashboardLink = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin':
        return { path: '/admin', label: 'Admin Panel', className: 'text-destructive hover:text-destructive/80' };
      case 'alumni':
        return { path: '/alumni', label: 'Dashboard', className: 'text-primary hover:text-primary/80' };
      case 'student':
        return { path: '/student', label: 'Dashboard', className: 'text-success hover:text-success/80' };
      default:
        return null;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardLink = getDashboardLink();

  return (
    <nav
      ref={navRef}
      className="fixed top-0 w-full z-50 glass-light px-6 md:px-20 py-5 border-b border-border/50"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-black tracking-tighter text-foreground">
          ALUMNI<span className="text-primary">HUB</span>
          {user?.role === 'admin' && (
            <span className="badge-admin ml-2">ADMIN</span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-12 text-nav text-muted-foreground">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors duration-300 ${isActive(link.path)
                ? 'text-primary'
                : 'hover:text-primary'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-6">
          {!isAuthenticated ? (
            <Link
              to="/signin"
              className="text-nav text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              Join Hub
            </Link>
          ) : (
            <>
              {dashboardLink && (
                <Link
                  to={dashboardLink.path}
                  className={`text-nav transition-colors duration-300 ${dashboardLink.className}`}
                >
                  {dashboardLink.label}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-nav text-muted-foreground hover:text-destructive transition-colors duration-300"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-foreground"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass-light border-t border-border/50 animate-fade-in">
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-nav py-2 transition-colors duration-300 ${isActive(link.path)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border/50 pt-4 mt-2">
              {!isAuthenticated ? (
                <Link
                  to="/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-nav text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  Join Hub
                </Link>
              ) : (
                <>
                  {dashboardLink && (
                    <Link
                      to={dashboardLink.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block text-nav py-2 transition-colors duration-300 ${dashboardLink.className}`}
                    >
                      {dashboardLink.label}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-nav text-muted-foreground hover:text-destructive transition-colors duration-300 py-2"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
