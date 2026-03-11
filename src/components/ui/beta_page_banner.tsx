
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";

export function BetaPageBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-500 glass shadow-sm shadow-amber-500/5">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-bold flex items-center gap-2">
          Módulo en Beta
        </AlertTitle>
        <AlertDescription className="text-sm font-medium opacity-90">
          Esta es una página beta y se encuentra en revisión técnica. Algunas funcionalidades podrían estar limitadas o sujetas a cambios.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
