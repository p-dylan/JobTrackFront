import type { ApiCompany } from "./company.types";

export type Employment = {
    user_id: number;
    company_id: number;
    job_title: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    company: ApiCompany;
};
