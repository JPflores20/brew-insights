
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from '@/context/auth_context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'hot_block' | 'cold_block')[];
}
export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, permissions, loading } = useAuth();

  // 1. Mientras verifica la sesión y los roles en Firestore, muestra un spinner
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1c]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // 2. Si no está autenticado, directo al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si la ruta está protegida por roles y el usuario no tiene ninguno de ellos:
  if (allowedRoles && !allowedRoles.some(role => permissions.includes(role))) {
    
    // Inteligencia de rebote: Si intenta entrar a una ruta prohibida, lo mandamos a lo que sí puede ver
    if (permissions.includes("hot_block")) {
      return <Navigate to="/cocimientos" replace />;
    }
    if (permissions.includes("cold_block")) {
      return <Navigate to="/bloque-frio" replace />;
    }
    
    // Si no tiene ningún rol asignado en absoluto, lo mandamos al login con sesión limpia
    return <Navigate to="/login" replace />;
  }

  // 4. Si pasa todas las validaciones, renderiza el componente protegido
  return <>{children}</>;
};