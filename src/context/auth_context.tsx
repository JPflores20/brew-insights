import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, setPersistence, browserSessionPersistence } from "firebase/auth";
import { auth,firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
}
const AuthContext = createContext<AuthContextType>({ user: null, permissions: [], loading: true });
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Declaramos la variable de desuscripción fuera para poder limpiarla al final del useEffect
    let unsubscribeFirebase: (() => void) | undefined;

    const initializeAuth = async () => {
      const isSessionActive = sessionStorage.getItem("BREW_INSIGHTS_SESSION");
      if (!isSessionActive) {
        await auth.signOut();
        sessionStorage.setItem("BREW_INSIGHTS_SESSION", "true");
      }

      try {
        await setPersistence(auth, browserSessionPersistence);
        
        // 5. Escuchamos los cambios de estado de autenticación de forma asíncrona
        unsubscribeFirebase = onAuthStateChanged(auth, async (currentUser) => {
          if (currentUser) {
            try {
              // Consultamos el documento exacto en la BD 'brewinsights' usando su UID real
              const docRef = doc(firestore, "user_permissions", currentUser.uid);
              const docSnap = await getDoc(docRef);

              if (docSnap.exists()) {
                const data = docSnap.data();
                setPermissions(data.permissions || []);
              } else {
                console.warn(`⚠️ El usuario ${currentUser.email} no tiene un documento de permisos.`);
                setPermissions([]);
              }
            } catch (firestoreError) {
              console.error("❌ Error al obtener permisos desde Firestore:", firestoreError);
              setPermissions([]);
            }
            // Guardamos el usuario de Auth una vez recuperados sus permisos
            setUser(currentUser);
          } else {
            // Si no hay usuario activo, limpiamos los estados
            setUser(null);
            setPermissions([]);
          }
          
          // Importante: Terminamos la carga SOLO después de haber intentado obtener los permisos
          setLoading(false);
        });

      } catch (error) {
        console.error("Error setting persistence:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    // 6. Limpieza correcta del listener de Firebase al desmontar el contexto
    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, permissions, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
      