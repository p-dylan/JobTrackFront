import { MapPin } from "lucide-react";
import { Avatar } from "../UI/Avatar";
import { ConnectionActions } from "./ConnectionActions";
import { getFullName, getInitials } from "../../utils/userDisplay";
import { useConnectionActions } from "../../hooks/useConnectionActions";
import type { UserCard } from "../../types/connection.type";

// Vignette d'un user dans la modale "Ajouter un contact" : métier, entreprise, ville + action de relation
export function UserTile({ user }: { user: UserCard }) {
  const actions = useConnectionActions();
  // métier : poste actuel validé, sinon titre du profil
  const job = user.job_title ?? user.headline;

  return (
    <div className="h-full bg-base-200 rounded-box border border-base-300 p-3 flex flex-col items-center text-center gap-1">
      <Avatar label={getInitials(user)} size="md" />
      <p className="font-medium text-sm mt-1 line-clamp-1">{getFullName(user)}</p>
      <p className="text-xs text-base-content/70 line-clamp-2 min-h-8">{job ?? "Métier non renseigné"}</p>
      {user.company && <p className="text-xs text-base-content/60 line-clamp-1">{user.company.name}</p>}
      {user.location && (
        <p className="text-xs text-base-content/50 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {user.location}
        </p>
      )}
      <div className="mt-auto pt-2">
        <ConnectionActions
          user={user}
          isPending={actions.isPending}
          onRequest={actions.request}
          onAccept={actions.accept}
          onReject={actions.reject}
          onRemove={actions.remove}
        />
      </div>
    </div>
  );
}
