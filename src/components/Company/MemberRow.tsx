import { UserMinus } from "lucide-react";
import { RoleBadge } from "./RoleBadge";
import { RoleSelect } from "./RoleSelect";
import { getFullName } from "../../utils/userDisplay";
import { MEMBER_ASSIGNABLE_ROLES, type RoleName } from "../../constants/roles";
import type { CompanyMember } from "../../types/employment.type";

interface MemberRowProps {
  member: CompanyMember;
  // false pour le PDG et pour soi-même : aucune action possible
  manageable: boolean;
  isPending: boolean;
  onChangeRole: (role: RoleName) => void;
  onFire: () => void;
}

// Ligne d'un membre validé : rôle modifiable et licenciement (PDG / RH uniquement)
export function MemberRow({ member, manageable, isPending, onChangeRole, onFire }: MemberRowProps) {
  const role = member.user.role?.name ?? null;
  const fullName = getFullName(member.user);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{fullName}</span>
          <RoleBadge role={role} />
        </div>
        <p className="text-sm text-base-content/60 truncate">
          {member.job_title} · {member.user.email}
        </p>
      </div>

      {manageable && role && MEMBER_ASSIGNABLE_ROLES.includes(role) && (
        <div className="flex items-center gap-2">
          <RoleSelect
            label={`Rôle de ${fullName}`}
            value={role}
            disabled={isPending}
            onChange={onChangeRole}
          />
          <button
            type="button"
            aria-label={`Retirer ${fullName} de l'entreprise`}
            className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10"
            disabled={isPending}
            onClick={onFire}
          >
            <UserMinus className="w-4 h-4" />
          </button>
        </div>
      )}
    </li>
  );
}
