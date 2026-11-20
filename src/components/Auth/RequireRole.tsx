import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { useToastStore } from "../../store/toast.store";
import { useRole } from "../../hooks/useRole";
import type { RoleName } from "../../constants/roles";

interface RequireRoleProps {
  roles: RoleName[];
  children: ReactNode;
}

// Garde de route : redirige vers l'accueil si le user n'a pas un des rôles demandés.
// Confort d'affichage uniquement, le back refuse de toute façon (403).
export function RequireRole({ roles, children }: RequireRoleProps) {
  const user = useAuthStore((state) => state.user);
  const { role, hasRole } = useRole();
  const allowed = hasRole(...roles);

  useEffect(() => {
    if (user && !allowed) {
      console.log(`[RequireRole] accès refusé (rôle: ${role ?? "aucun"}), requis: ${roles.join(", ")}`);
      useToastStore.getState().addToast("Vous n'avez pas accès à cette page", "warning");
    }
  }, [user, allowed, role, roles]);

  // user pas encore chargé (restauration de session)
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
      </div>
    );
  }

  return allowed ? <>{children}</> : <Navigate to="/app" replace />;
}
