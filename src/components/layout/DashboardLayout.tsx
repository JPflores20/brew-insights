// src/components/layout/DashboardLayout.tsx
import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Agregar useNavigate
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  GitCompare, 
  Cog, 
  Beer,
  Menu,
  X,
  Timer,
  LogOut,
  ArrowLeft // Nuevo icono
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth"; 
import { auth } from "@/lib/firebase";   

interface DashboardLayoutProps {
  children: ReactNode;
}

// Actualizamos las rutas agregando /cocimientos al inicio
const navItems = [
  { 
    path: "/cocimientos", 
    label: "Resumen", 
    icon: LayoutDashboard,
    description: "Tablero principal"
  },
  { 
    path: "/cocimientos/comparacion", 
    label: "Comparación", 
    icon: GitCompare,
    description: "Comparar lotes"
  },
  { 
    path: "/cocimientos/maquinaria", 
    label: "Maquinaria", 
    icon: Cog,
    description: "Detalle por equipo"
  },
  { 
    path: "/cocimientos/ciclos", 
    label: "Ciclos & Gantt", 
    icon: Timer,
    description: "Tiempos y secuencia"
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate(); // Hook para navegación
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        {/* Header del Sidebar con link al Menú Principal */}
        <div 
            className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
            onClick={() => navigate("/")}
            title="Volver al Menú Principal"
        >
          <Beer className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-bold text-foreground text-lg">Brew Insights</h1>
            <p className="text-xs text-muted-foreground">Área: Cocimientos</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {/* Botón explícito para volver */}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Menú
          </Button>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname === item.path + "/";
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-primary" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs opacity-70">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            v1.1.0 • Producción
          </p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2" onClick={() => navigate("/")}>
          <Beer className="h-6 w-6 text-primary" />
          <span className="font-bold text-foreground">Cocimientos</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute top-16 left-0 right-0 bg-sidebar border-b border-sidebar-border p-4 space-y-2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
             <Button 
                variant="ghost" 
                className="w-full justify-start mb-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Menú
              </Button>

            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-primary" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 mt-2 border-t border-sidebar-border">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-16 overflow-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}