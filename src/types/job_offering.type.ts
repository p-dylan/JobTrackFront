// Offres renvoyées par le microservice ms_job_offering (MongoDB, camelCase)
// via le gateway job-searchBack (/job_offering).

export type ContractType = "CDI" | "CDD" | "FREELANCE" | "STAGE";

export type WorkMode = "ON_SITE" | "REMOTE" | "HYBRID";

export type OfferCategory =
    | "INFORMATIQUE"
    | "ENSEIGNEMENT"
    | "HOTELLERIE"
    | "ADMINISTRATION"
    | "COMMERCE"
    | "TRANSPORT"
    | "SANTE"
    | "INDUSTRIE"
    | "MARKETING"
    | "FINANCE";

export type JobOffering = {
    _id: string; // ObjectId Mongo
    companyId: number;
    createdByUserId: number;
    title: string;
    description: string;
    contractType: ContractType;
    workMode: WorkMode;
    partTime: boolean;
    category: OfferCategory | null;
    location: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

export type PaginatedJobOfferings = {
    data: JobOffering[];
    total: number;
    skip: number;
    take: number;
};

// Query params de GET /job_offering
export type FindJobOfferingsParams = {
    skip?: number;
    take?: number;
    search?: string;
    contractType?: ContractType;
    companyId?: number;
    sort?: "asc" | "desc";
    favoritesOnly?: boolean;
    category?: OfferCategory;
    workMode?: WorkMode;
    partTime?: boolean;
};

// Body de POST /job_offering (companyId et createdByUserId sont déduits du token côté back)
export type CreateJobOfferingData = {
    title: string;
    description: string;
    contractType: ContractType;
    workMode?: WorkMode;
    partTime?: boolean;
    category?: OfferCategory;
    location?: string;
};

export type UpdateJobOfferingData = Partial<CreateJobOfferingData>;
