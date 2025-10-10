import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 gradient-hero rounded-full mb-4">
          <AlertCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Button variant="hero" asChild>
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
