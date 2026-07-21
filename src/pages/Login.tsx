import { useState } from "react";
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, sendPasswordResetEmail } from "firebase/auth";
import { auth,firestore } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { collection, query, where, getDocs } from "firebase/firestore";
import { permission } from "process";
import { log } from "util";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico en el campo superior para recuperar la contraseña.");
      setResetMessage("");
      return;
    }
    setError("");
    setResetMessage("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage("Se ha enviado un correo para restablecer tu contraseña.");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError("No hay ningún usuario registrado con este correo.");
      } else {
        setError("Error al enviar el correo de recuperación. Revisa tu conexión o intenta más tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const q = query(collection(firestore, "user_permissions"), where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const permissions: string[] = userData.permissions || [];  
        if (permissions.includes("admin")) {
            console.log("Acceso concedido: Administrador");
            navigate("/"); // Entra a todo (Panel Principal)
          } else if (permissions.includes("hot_block")) {
            console.log("Acceso concedido: Hot Block");
            navigate("/cocimientos"); // Redirige a su sección específica
          } else if (permissions.includes("cold_block")) {
            console.log("Acceso concedido: Cold Block");
            navigate("/bloque-frio"); // Redirige a su sección específica
          } else {
            // El usuario existe pero el arreglo de permisos está vacío o no coincide
            setError("No tienes secciones asignadas en tu perfil. Contacta al administrador.");
          }
      } else {
          // Caso en el que el usuario se autenticó en Auth, pero no fue registrado en Firestore
        setError("Usuario autenticado, pero no cuenta con un registro de permisos en el sistema.");
      }

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Credenciales incorrectas.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Cuenta bloqueada temporalmente. Intenta más tarde.");
      } else {
        setError(`Error de conexión con el servidor. (${err.code || err.message})`);
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Malla de cuadrícula sutil */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 75%)"
        }}
      />
      {/* Esferas flotantes animadas */}
      <div className="animate-orb-a absolute -top-[10vw] -left-[10vw] h-[45vw] w-[45vw] rounded-full bg-blue-600 opacity-40 blur-[120px] pointer-events-none" />
      <div className="animate-orb-b absolute top-[10vh] -right-[12vw] h-[40vw] w-[40vw] rounded-full bg-violet-600 opacity-40 blur-[130px] pointer-events-none" />
      <div className="animate-orb-c absolute -bottom-[10vw] left-[20vw] h-[42vw] w-[42vw] rounded-full bg-cyan-500 opacity-30 blur-[140px] pointer-events-none" />
      <div className="animate-orb-d absolute bottom-[5vh] right-[15vw] h-[30vw] w-[30vw] rounded-full bg-fuchsia-500 opacity-25 blur-[120px] pointer-events-none" />
      
      {/* Viñeta suave */}
      <div className="absolute inset-0 bg-slate-950/30 pointer-events-none" />

      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-3 text-center pb-8 pt-10">
          <div className="group relative mx-auto mb-6 cursor-pointer transform transition-all duration-500">
            <div className="absolute -inset-6 animate-pulse rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-violet-600 opacity-40 blur-2xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-80 group-hover:blur-3xl"></div>
            <img 
              src="/logos/BREWMAN.jpeg" 
              alt="Brewman Logo" 
              className="relative h-40 w-40 rounded-[2rem] object-cover shadow-2xl ring-2 ring-white/10 transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-105 group-hover:-rotate-3 group-hover:shadow-[0_20px_50px_rgba(8,112,184,0.4)] group-hover:ring-white/30" 
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight text-white">Brew Insights</CardTitle>
            <CardDescription className="text-slate-400 text-base">Análisis de tendencias</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {resetMessage && (
              <Alert className="bg-green-900/50 border-green-800 text-green-200">
                <AlertDescription>{resetMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-medium ml-1">
                Correo Corporativo
              </Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="usuario@modelo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="h-11 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all pl-4"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-slate-300 font-medium">
                  Contraseña
                </Label>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="h-11 bg-slate-950/50 border-slate-800 text-slate-100 focus:border-amber-500/50 focus:ring-amber-500/20 transition-all pl-4 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  </span>
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 font-semibold text-base bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-900/20 mt-2 transition-all duration-300 hover:shadow-amber-900/40"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Accediendo...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col justify-center py-6 bg-white/5 border-t border-white/5 rounded-b-xl gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Acceso restringido</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <button 
              type="button" 
              onClick={handlePasswordReset}
              disabled={loading}
              className="text-amber-500 hover:text-amber-400 transition-colors font-medium cursor-pointer"
            >
              Recuperar Contraseña
            </button>
          </div>
          <div className="mt-2 text-[10px] text-slate-500/50 text-center select-none">
            Creado por: <br /> Ing. en Soft. José Luis Flores Carrillo
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}