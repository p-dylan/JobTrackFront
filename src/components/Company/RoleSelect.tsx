import { MEMBER_ASSIGNABLE_ROLES, ROLE_LABELS, type RoleName } from "../../constants/roles";

interface RoleSelectProps {
  value: RoleName;
  onChange: (role: RoleName) => void;
  disabled?: boolean;
  label: string;
}

// Liste déroulante des rôles qu'un PDG/RH peut attribuer (employe, recruteur, RH)
export function RoleSelect({ value, onChange, disabled, label }: RoleSelectProps) {
  return (
    <select
      aria-label={label}
      className="select select-bordered select-sm w-auto"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as RoleName)}
    >
      {MEMBER_ASSIGNABLE_ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  );
}
