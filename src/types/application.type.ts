import type { ApplicationStatus } from "./company.types";

export type Application = {
    id: number;
    user_id: number;
    job_offering_id: string; // ObjectId de l'offre dans le ms
    company_id: number;
    status: ApplicationStatus;
    created_at: string;
    updated_at: string;
};

// Statuts autorisés par PATCH /application/:id/status
export type UpdatableApplicationStatus = Exclude<ApplicationStatus, "PENDING">;
