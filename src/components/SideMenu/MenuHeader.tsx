import { X } from "lucide-react";
import { Avatar } from "../UI/Avatar";
import { RoleBadge } from "../Company/RoleBadge";
import type { RoleName } from "../../constants/roles";

interface MenuHeaderProps {
  name: string;
  email: string;
  initials: string;
  role?: RoleName | null;
  // Photo réelle optionnelle : l'avatar dégradé + initiales n'est qu'un
  // fallback tant qu'aucune photo de profil n'est disponible.
  avatarUrl?: string;
  onClose: () => void;
}

export function MenuHeader({
  name,
  email,
  initials,
  role,
  avatarUrl,
  onClose,
}: MenuHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-base-content/10 px-4 pt-6 pb-6">
      <div className="flex items-center gap-4">
        <Avatar label={initials} avatarUrl={avatarUrl} size="lg" />
        <div>
          <h2 className="font-semibold text-base-content">{name}</h2>
          <p className="text-sm text-base-content/70">{email}</p>
          <div className="mt-1">
            <RoleBadge role={role} />
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        aria-label="Fermer le menu"
        className="btn btn-ghost btn-circle btn-sm bg-base-200 hover:bg-base-300 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
