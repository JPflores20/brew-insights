import { useLocation, Link } from "react-router-dom"; 
import { useEffect } from "react";
const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404 Error: Intento de acceso a ruta inexistente:", location.pathname);
  }, [location.pathname]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">¡Ups! Página no encontrada</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
};
export default NotFound;