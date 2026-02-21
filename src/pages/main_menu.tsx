// src/pages/MainMenu.tsx
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame, Snowflake, LogOut, Beer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function MainMenu() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0f1c] relative overflow-hidden p-4">
      {/* Fondos decorativos similares al Login */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[120px]" />

      <div className="z-10 w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-2">
             <Beer className="h-8 w-8 text-amber-500" />
             <h1 className="text-3xl font-bold text-white">Brew Insights</h1>
          </div>
          <p className="text-slate-400">Selecciona el área de producción a visualizar</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Opción 1: Cocimientos (Hot Block) */}
          <Card 
            className="bg-slate-900/50 border-amber-500/20 hover:border-amber-500/60 hover:bg-slate-900/80 cursor-pointer transition-all duration-300 group"
            onClick={() => navigate("/cocimientos")}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-amber-500/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Flame className="h-12 w-12 text-amber-500" />
              </div>
              <CardTitle className="text-2xl text-white">Cocimientos</CardTitle>
              <CardDescription className="text-slate-400">Hot Block</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-slate-500 text-sm">
              Monitoreo de cocción, comparación de lotes y análisis de maquinaria.
            </CardContent>
          </Card>

          {/* Opción 2: Bloque Frío (Cold Block) */}
          <Card 
            className="bg-slate-900/50 border-blue-500/20 hover:border-blue-500/60 hover:bg-slate-900/80 cursor-pointer transition-all duration-300 group"
            onClick={() => navigate("/bloque-frio")}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-blue-500/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                <Snowflake className="h-12 w-12 text-blue-500" />
              </div>
              <CardTitle className="text-2xl text-white">Bloque Frío</CardTitle>
              <CardDescription className="text-slate-400">Cold Block</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-slate-500 text-sm">
              Fermentación, maduración y filtración.
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center pt-8">
          <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}