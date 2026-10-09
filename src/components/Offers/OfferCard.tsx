import { MapPin, Clock, Heart, X, BadgeCheck } from "lucide-react";
import { Link } from "react-router";
import type { WorkMode } from "../../types/job_offering.type";
import { WORK_MODE_LABEL } from "../../constants/job_offering";

// En dessous de ce nombre de candidatures, on incite à postuler tôt plutôt
// que d'afficher la date de publication.
const EARLY_APPLICANT_THRESHOLD = 5;

interface OfferCardProps {
  to: string;
  role: string;
  company: string;
  contractLabel: string;
  location: string | null;
  timeAgo: string;
  workMode?: WorkMode;
  // pas encore fourni par le ms : gardés optionnels pour plus tard
  applicantCount?: number;
  verified?: boolean;
  saved: boolean;
  onToggleSave: () => void;
  onDismiss?: () => void;
}

// Carte d'une offre : titre cliquable vers le détail, entreprise, lieu, cœur favori et bouton masquer.
export function OfferCard({
  to,
  role,
  company,
  contractLabel,
  location,
  timeAgo,
  workMode = "ON_SITE",
  applicantCount,
  verified,
  saved,
  onToggleSave,
  onDismiss,
}: OfferCardProps) {
  const isEarlyApplicant =
    applicantCount !== undefined && applicantCount < EARLY_APPLICANT_THRESHOLD;

  return (
    <div className="py-3 pl-1 pr-3 flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-primary/10 text-primary font-semibold">
        {company.charAt(0)}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5 leading-none">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex items-center gap-1 font-bold text-primary leading-none hover:underline cursor-pointer">
            <Link to={to} className="truncate">
              {role}
            </Link>
            {verified && (
              <BadgeCheck
                aria-label="Offre vérifiée"
                className="w-4 h-4 shrink-0"
              />
            )}
          </h3>
          {/* w-11 h-11 (44px) : zone tactile recommandée, sans agrandir la
              rangée du titre grâce à la marge négative qui absorbe le
              débordement (bouton centré sur la ligne de texte de 16px). */}
          <div className="flex items-center gap-1 shrink-0 -mt-3.5 -mb-3.5 -mr-2">
            <button
              type="button"
              aria-label={saved ? "Retirer des favoris" : "Sauvegarder l'offre"}
              onClick={onToggleSave}
              className={`btn btn-ghost btn-circle w-11 h-11 min-h-0 ${
                saved
                  ? "text-primary"
                  : "text-base-content/40 hover:text-primary"
              }`}
            >
              <Heart className="w-5 h-5" fill={saved ? "currentColor" : "none"} />
            </button>
            {onDismiss && (
              <button
                type="button"
                aria-label="Masquer cette offre"
                onClick={onDismiss}
                className="btn btn-ghost btn-circle w-11 h-11 min-h-0 text-base-content/40 hover:text-error"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-base-content/70 font-medium truncate">
          {company} · {contractLabel}
        </p>

        <div className="flex items-start justify-between gap-2 text-sm text-base-content/60">
          <span className="flex flex-col min-w-0 gap-0.5">
            {location && (
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{location}</span>
              </span>
            )}
            {isEarlyApplicant && (
              <span className="text-xs font-medium text-success">
                Soyez l'un des premiers candidats
              </span>
            )}
          </span>
          <span className="flex flex-col items-end shrink-0">
            <span>{WORK_MODE_LABEL[workMode]}</span>
            {isEarlyApplicant && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo}
              </span>
            )}
          </span>
        </div>

        {!isEarlyApplicant && (
          <div className="text-xs font-medium">
            <span className="flex items-center gap-1 text-base-content/50">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
