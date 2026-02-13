import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, setPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Manual Session Guard:
      // Si no existe la marca de sesión en este tab, forzamos cierre de sesión.
      // Esto asegura que al abrir una nueva pestaña (sessionStorage vacío) el usuario empiece desconectado,
      // incluso si había un token persistente en localStorage.
      const isSessionActive = sessionStorage.getItem("BREW_INSIGHTS_SESSION");
      
      if (!isSessionActive) {
        await auth.signOut();
        sessionStorage.setItem("BREW_INSIGHTS_SESSION", "true");
      }

      // Asegurar que la persistencia sea de sesión (se cierre al cerrar pestaña)
      try {
        await setPersistence(auth, browserSessionPersistence);
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting persistence:", error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};