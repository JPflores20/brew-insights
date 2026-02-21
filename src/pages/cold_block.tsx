
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HardHat } from "lucide-react";
export default function ColdBlock() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a0f1c] flex flex-col items-center justify-center text-white p-4">
      <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-2xl text-center max-w-lg shadow-2xl">
        <div className="bg-blue-500/10 p-6 rounded-full inline-block mb-6">
          <HardHat className="h-16 w-16 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Bloque Frío</h1>
        <p className="text-slate-400 mb-8 text-lg">
          Este módulo se encuentra actualmente en desarrollo y producción. 
          Próximamente podrás visualizar datos de fermentación.
        </p>
        <Button 
          onClick={() => navigate("/")}
          className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Menú
        </Button>
      </div>
    </div>
  );
}