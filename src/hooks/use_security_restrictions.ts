import { useEffect } from "react";
import { useAuth } from "@/context/auth_context";
import { useToast } from "@/hooks/use_toast";

export function useSecurityRestrictions() {
  const { permissions, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Only apply restrictions if a user is logged in AND they don't have the admin permission.
    const isAdmin = permissions.includes("admin");
    
    if (user && !isAdmin) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        toast({
          title: "Acción no permitida",
          description: "No tienes permisos para ver el menú contextual.",
          variant: "destructive"
        });
      };

      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        toast({
          title: "Acción no permitida",
          description: "La copia de información está deshabilitada por seguridad.",
          variant: "destructive"
        });
      };

      // Add event listeners
      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("copy", handleCopy);

      // Disable text selection globally
      document.body.style.userSelect = "none";
      document.body.style.setProperty("-webkit-user-select", "none");

      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("copy", handleCopy);
        document.body.style.userSelect = "";
        document.body.style.removeProperty("-webkit-user-select");
      };
    } else {
      // Clean up if user becomes admin or logs out
      document.body.style.userSelect = "";
      document.body.style.removeProperty("-webkit-user-select");
    }
  }, [permissions, user, toast]);
}
