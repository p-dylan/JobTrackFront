import { useState } from "react";
import { Check, X } from "lucide-react";
import { RoleSelect } from "./RoleSelect";
import { getFullName } from "../../utils/userDisplay";
import { ROLE, type RoleName } from "../../constants/roles";
import type { CompanyMember } from "../../types/employment.type";

interface PendingRowProps {
  request: CompanyMember;
  isPending: boolean;
  onAccept: (role: RoleName) => void;
  onReject: () => void;
}

// Ligne d'une demande d'adhésion : choix du rôle puis accepter / refuser
export function PendingRow({ request, isPending, onAccept, onReject }: PendingRowProps) {
  const [role, setRole] = useState<RoleName>(ROLE.EMPLOYE);
  const fullName = getFullName(request.user);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <span className="font-medium truncate block">{fullName}</span>
        <p className="text-sm text-base-content/60 truncate">
          Poste demandé : {request.job_title} · {request.user.email}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <RoleSelect label={`Rôle attribué à ${fullName}`} value={role} disabled={isPending} onChange={setRole} />
        <button
          type="button"
          className="btn btn-success btn-sm"
          disabled={isPending}
          onClick={() => onAccept(role)}
        >
          <Check className="w-4 h-4" />
          Accepter
        </button>
        <button
          type="button"
          aria-label={`Refuser la demande de ${fullName}`}
          className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10"
          disabled={isPending}
          onClick={onReject}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}
