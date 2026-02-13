import { useState } from "react";
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Beer, Lock, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Configurar persistencia de sesión (solo mientras la pestaña esté abierta)
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // Redirigir al dashboard
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Credenciales incorrectas.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Cuenta bloqueada temporalmente. Intenta más tarde.");
      } else {
        setError("Error de conexión con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden">
      {/* Fondo decorativo (Spots de luz) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-3 text-center pb-8 pt-10">
          {/* Logo animado y estilizado */}
          <div className="mx-auto bg-gradient-to-tr from-amber-500 to-orange-600 p-4 rounded-2xl shadow-lg shadow-amber-500/20 mb-2 transform transition-transform hover:scale-105 duration-300">
            <Beer className="h-8 w-8 text-white" />
          </div>
          
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight text-white">
              Brew Insights
            </CardTitle>
            <CardDescription className="text-slate-400 text-base">
              Plataforma de Analítica Industrial
            </CardDescription>
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

        <CardFooter className="flex justify-center py-6 bg-white/5 border-t border-white/5 rounded-b-xl">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="h-3 w-3" />
            <span>Acceso restringido a personal autorizado</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}