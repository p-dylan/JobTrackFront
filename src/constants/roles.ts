// Noms des rôles tels qu'enregistrés en BDD (miroir de job-searchBack/src/role/role.constants.ts)
export const ROLE = {
  ADMIN: "admin",
  CANDIDAT: "candidat",
  EMPLOYE: "employe",
  RECRUTEUR: "recruteur",
  RH: "RH",
  PDG: "PDG",
} as const;

export type RoleName = (typeof ROLE)[keyof typeof ROLE];

// Rôles autorisés à gérer les offres et les candidatures reçues
export const RECRUITING_ROLES: RoleName[] = [ROLE.RECRUTEUR, ROLE.RH, ROLE.PDG];

// Rôles autorisés à gérer les membres de leur entreprise
export const COMPANY_MANAGER_ROLES: RoleName[] = [ROLE.PDG, ROLE.RH];

// Rôles qu'un PDG/RH peut attribuer à un membre (jamais PDG ni admin)
export const MEMBER_ASSIGNABLE_ROLES: RoleName[] = [ROLE.EMPLOYE, ROLE.RECRUTEUR, ROLE.RH];

// Libellés affichés à l'utilisateur
export const ROLE_LABELS: Record<RoleName, string> = {
  admin: "Administrateur",
  candidat: "Candidat",
  employe: "Employé",
  recruteur: "Recruteur",
  RH: "RH",
  PDG: "PDG",
};
