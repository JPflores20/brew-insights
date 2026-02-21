import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Cargando datos..." }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 h-full min-h-[300px]">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="relative"
            >
                <Loader2 className="h-12 w-12 text-primary" />
                <motion.div
                    className="absolute inset-0 rounded-full border-t-2 border-accent"
                    animate={{ rotate: -180 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-muted-foreground font-medium animate-pulse"
            >
                {message}
            </motion.p>
        </div>
    );
}
