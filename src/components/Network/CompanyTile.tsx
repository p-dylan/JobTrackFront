import { Building2, Check, Plus, Users } from "lucide-react";
import { useFollowCompany } from "../../hooks/useFollowCompany";
import type { CompanyWithFollow } from "../../types/company.types";

// Vignette d'une entreprise dans la modale "Suivre une entreprise"
export function CompanyTile({ company }: { company: CompanyWithFollow }) {
  const { toggleFollow, isPending } = useFollowCompany();

  return (
    <div className="h-full bg-base-200 rounded-box border border-base-300 p-3 flex flex-col items-center text-center gap-1">
      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        <Building2 className="w-5 h-5" />
      </div>
      <p className="font-medium text-sm mt-1 line-clamp-1">{company.name}</p>
      <p className="text-xs text-base-content/70 line-clamp-1">{company.business_sector}</p>
      <p className="text-xs text-base-content/50 flex items-center gap-1">
        <Users className="w-3 h-3" />
        {company.followers_count} abonné{company.followers_count > 1 ? "s" : ""}
      </p>
      <div className="mt-auto pt-2">
        <button
          type="button"
          className={`btn btn-xs ${company.is_followed ? "btn-outline" : "btn-primary"}`}
          disabled={isPending}
          onClick={() => toggleFollow(company.id, !company.is_followed)}
          aria-label={`${company.is_followed ? "Ne plus suivre" : "Suivre"} ${company.name}`}
        >
          {company.is_followed ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {company.is_followed ? "Suivi" : "Suivre"}
        </button>
      </div>
    </div>
  );
}
