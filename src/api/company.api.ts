import { api } from "../utils/axios-client";
import type { ApiCompany, CreateCompanyData } from "../types/company.types";

export class CompanyApi {
    // Récupère toutes les entreprises non supprimées.
    static async getAll(): Promise<ApiCompany[]> {
        const { data } = await api.get("company");
        return data;
    }

    // Récupère une entreprise par son id.
    static async getOne(id: number): Promise<ApiCompany> {
        const { data } = await api.get(`company/${id}`);
        return data;
    }

    // Crée une entreprise (le user connecté en devient le créateur).
    static async create(body: CreateCompanyData): Promise<ApiCompany> {
        // le back répond { data: { company }, message }
        const { data } = await api.post("company", body);
        return data.data.company;
    }
}
