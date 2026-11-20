import { useAuthStore } from "../store/auth.store";
import {
  COMPANY_MANAGER_ROLES,
  RECRUITING_ROLES,
  ROLE,
  type RoleName,
} from "../constants/roles";

// Rôle du user connecté + raccourcis de droits (confort d'affichage : la vraie sécurité est côté back)
export function useRole() {
  const role = useAuthStore((state) => state.user?.role ?? null);
  const hasRole = (...roles: RoleName[]) => role !== null && roles.includes(role);

  return {
    role,
    hasRole,
    isAdmin: role === ROLE.ADMIN,
    isCandidat: role === ROLE.CANDIDAT,
    isPdg: role === ROLE.PDG,
    canRecruit: hasRole(...RECRUITING_ROLES),
    canManageCompany: hasRole(...COMPANY_MANAGER_ROLES),
  };
}
