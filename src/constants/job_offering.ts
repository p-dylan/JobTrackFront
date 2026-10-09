// src/constants/job_offering.ts
// Libellés FR des enums du ms_job_offering, partagés entre cartes, détail et formulaire.
import type { ApplicationStatus } from "../types/company.types";
import type { ContractType, OfferCategory, WorkMode } from "../types/job_offering.type";

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  CDI: "CDI",
  CDD: "CDD",
  FREELANCE: "Freelance",
  STAGE: "Stage",
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  ON_SITE: "Sur site",
  REMOTE: "À distance",
  HYBRID: "Hybride",
};

export const OFFER_CATEGORY_LABEL: Record<OfferCategory, string> = {
  INFORMATIQUE: "Informatique",
  ENSEIGNEMENT: "Enseignement",
  HOTELLERIE: "Hôtellerie",
  ADMINISTRATION: "Administration publique",
  COMMERCE: "Commerce",
  TRANSPORT: "Transport & Logistique",
  SANTE: "Santé",
  INDUSTRIE: "Industrie",
  MARKETING: "Marketing & Communication",
  FINANCE: "Finance",
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  WITHDRAWN: "Retirée",
};

// Acceptée = positif, refusée = négatif, en attente / retirée restent neutres.
export const APPLICATION_STATUS_BADGE_CLASS: Record<ApplicationStatus, string> = {
  PENDING: "badge-soft",
  ACCEPTED: "badge-success",
  REJECTED: "badge-error",
  WITHDRAWN: "badge-ghost",
};

// Nombre d'offres chargées au départ puis à chaque "Charger plus" : 5 pour que
// le bouton "Publier une offre" (sous la liste) reste visible au chargement.
export const OFFERS_PAGE_SIZE = 5;
