export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type Company = {
  id: number;
  name: string;
  businessSector: string;
  website: string | null;
  address: string | null;
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

// Body de POST /company
export type CreateCompanyData = {
  name: string;
  business_sector: string;
  website?: string;
  address?: string;
  is_public: boolean;
};