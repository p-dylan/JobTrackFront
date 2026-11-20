import type { ApiCompany } from "./company.types";
import type { RoleName } from "../constants/roles";

// PENDING = demande d'adhésion en attente, ACTIVE = membre validé (n'a de sens que si is_current)
export type EmploymentStatus = "PENDING" | "ACTIVE" | "REJECTED";

export type Employment = {
    user_id: number;
    company_id: number;
    job_title: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    status: EmploymentStatus;
    company: ApiCompany;
};

// Body de POST /employment (demande d'adhésion si is_current = true)
export type CreateEmploymentData = {
    company_id: number;
    job_title: string;
    start_date: string;
    is_current: boolean;
};

// Membre (ou demande) renvoyé par GET /company/:id/members(/pending)
export type CompanyMember = Omit<Employment, "company"> & {
    user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        role: { name: RoleName } | null;
    };
};
