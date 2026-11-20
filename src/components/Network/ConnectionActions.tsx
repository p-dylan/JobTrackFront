import { Check, Clock, UserCheck, UserMinus, UserPlus, X } from "lucide-react";
import type { UserCard } from "../../types/connection.type";

interface ConnectionActionsProps {
  user: UserCard;
  isPending: boolean;
  onRequest: (id: number) => void;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onRemove: (id: number) => void;
  // true : un contact peut être retiré (liste de contacts), sinon simple pastille "Contact"
  allowRemove?: boolean;
}

// Boutons selon l'état de la relation : Se connecter / En attente (annuler) / Accepter-Refuser / Contact
export function ConnectionActions({
  user,
  isPending,
  onRequest,
  onAccept,
  onReject,
  onRemove,
  allowRemove = false,
}: ConnectionActionsProps) {
  const fullName = `${user.first_name} ${user.last_name}`;

  switch (user.connection_status) {
    case "none":
      return (
        <button
          type="button"
          className="btn btn-primary btn-xs"
          disabled={isPending}
          onClick={() => onRequest(user.id)}
          aria-label={`Se connecter avec ${fullName}`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Se connecter
        </button>
      );
    case "sent":
      return (
        <div className="flex items-center gap-1">
          <span className="badge badge-ghost badge-sm gap-1">
            <Clock className="w-3 h-3" />
            En attente
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-circle"
            disabled={isPending}
            onClick={() => onRemove(user.id)}
            aria-label={`Annuler l'invitation à ${fullName}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    case "received":
      return (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn btn-success btn-xs"
            disabled={isPending}
            onClick={() => onAccept(user.id)}
            aria-label={`Accepter l'invitation de ${fullName}`}
          >
            <Check className="w-3.5 h-3.5" />
            Accepter
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-circle text-error"
            disabled={isPending}
            onClick={() => onReject(user.id)}
            aria-label={`Refuser l'invitation de ${fullName}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    case "connected":
      return allowRemove ? (
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-circle text-error"
          disabled={isPending}
          onClick={() => {
            if (window.confirm(`Retirer ${fullName} de vos contacts ?`)) onRemove(user.id);
          }}
          aria-label={`Retirer ${fullName} de vos contacts`}
        >
          <UserMinus className="w-4 h-4" />
        </button>
      ) : (
        <span className="badge badge-success badge-sm gap-1">
          <UserCheck className="w-3 h-3" />
          Contact
        </span>
      );
  }
}
