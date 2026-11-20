import { Link } from "react-router";
import { Users, Folder, Contact, ChevronRight } from "lucide-react";
import { Card } from "./Card";
import type { Company, ApplicationStatus } from "../../types/company.types";

const statusColor: Record<ApplicationStatus | 'NONE', string> = {
    ACCEPTED: "bg-success",
    PENDING: "bg-warning",
    REJECTED: "bg-error",
    WITHDRAWN: "bg-neutral",
    NONE: "bg-base-300", //pastille neutre par défaut
};

// Entreprise suivie : clic => fiche entreprise (offres, suivi, rejoindre)
export function CompanyCard({ company }: { company: Company }) {
    return (
        <Link to={`/app/network/companies/${company.id}`} className="block hover:opacity-90 transition-opacity">
            <Card>
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor[company.latestApplicationStatus ?? 'NONE']}`}/>
                        <span className="font-medium truncate">{company.name}</span>
                        <span className="text-sm opacity-60 truncate hidden sm:inline">· {company.businessSector}</span>
                    </div>
                    <ChevronRight size={16} className="opacity-50 shrink-0" />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-70">
                    <span className="flex items-center gap-1">
                        <Users size={14} /> {company.followersCount} abonné{company.followersCount > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                        <Contact size={14} /> {company.contactsCount} Contact{company.contactsCount > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                        <Folder size={14} /> {company.candidaturesCount} Candidature{company.candidaturesCount > 1 ? "s" : ""}
                    </span>
                </div>
            </Card>
        </Link>
    );
}
