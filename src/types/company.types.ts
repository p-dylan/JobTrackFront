export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

// Entreprise suivie, telle qu'affichée dans Relations
export type Company = {
  id: number;
  name: string;
  businessSector: string;
  website: string | null;
  address: string | null;
  followersCount: number;
  // mes contacts qui travaillent dans cette entreprise
  contactsCount: number;
  candidaturesCount: number;
  latestApplicationStatus: ApplicationStatus | null;
};

// Entreprise telle que renvoyée par le back (Prisma, snake_case)
export type ApiCompany = {
  id: number;
  name: string;
  business_sector: string;
  website: string | null;
  address: string | null;
  is_public: boolean;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  deletedAt: string | null;
};

// Entreprise enrichie (search / followed / details) : abonnés + suivie par le user connecté
export type CompanyWithFollow = ApiCompany & {
  followers_count: number;
  is_followed: boolean;
};

// Réponse paginée des modales de recherche (entreprises / users)
export type Paginated<T> = {
  data: T[];
  total: number;
};

// Body de POST /company/own
export type CreateCompanyData = {
  name: string;
  business_sector: string;
  website?: string;
  address?: string;
  is_public: boolean;
};