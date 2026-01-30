import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import VantaBackground from "@/components/layout/VantaBackground";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <VantaBackground />
      <div className="glass-solid rounded-[3rem] p-12 md:p-16 text-center max-w-lg relative z-10">
        <h1 className="text-8xl font-black text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/">
            <button className="flex items-center gap-2 px-6 py-3 btn-primary">
              <Home size={18} />
              Go Home
            </button>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 btn-secondary"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
