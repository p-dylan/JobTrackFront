import { ROLE, ROLE_LABELS, type RoleName } from "../../constants/roles";

const roleColor: Record<RoleName, string> = {
  admin: "badge-neutral",
  candidat: "badge-ghost",
  employe: "badge-ghost",
  recruteur: "badge-info",
  RH: "badge-secondary",
  PDG: "badge-primary",
};

// Pastille affichant le rôle (rien si pas de rôle)
export function RoleBadge({ role }: { role: RoleName | null | undefined }) {
  if (!role) return null;
  return (
    <span className={`badge badge-sm font-semibold ${roleColor[role] ?? roleColor[ROLE.EMPLOYE]}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}
