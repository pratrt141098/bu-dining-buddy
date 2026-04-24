import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-space-4">
      <div className="ios-card p-space-6 w-full max-w-[390px] text-left">
        <h1 className="font-display mb-space-3 text-2xl font-bold text-foreground">404</h1>
        <p className="font-body mb-space-4 text-sm text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="inline-flex min-h-[44px] items-center font-body text-sm font-medium text-primary hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
