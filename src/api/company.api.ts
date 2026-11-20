import { api } from "../utils/axios-client";
import type {
    ApiCompany,
    CompanyWithFollow,
    CreateCompanyData,
    Paginated,
} from "../types/company.types";

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

    // Recherche paginée par nom ou secteur (modale "Suivre une entreprise").
    static async search(params: { search?: string; skip: number; take: number }): Promise<Paginated<CompanyWithFollow>> {
        const { data } = await api.get("company/search", { params });
        return data;
    }

    // Entreprises suivies par le user connecté.
    static async getFollowed(): Promise<CompanyWithFollow[]> {
        const { data } = await api.get("company/followed");
        return data;
    }

    // Fiche entreprise : abonnés et état de suivi.
    static async getDetails(id: number): Promise<CompanyWithFollow> {
        const { data } = await api.get(`company/${id}/details`);
        return data;
    }

    // Suit une entreprise (direct, sans demande).
    static async follow(id: number): Promise<CompanyWithFollow> {
        const { data } = await api.post(`company/${id}/follow`);
        return data;
    }

    // Ne suit plus une entreprise.
    static async unfollow(id: number): Promise<CompanyWithFollow> {
        const { data } = await api.delete(`company/${id}/follow`);
        return data;
    }

    // Crée l'entreprise du user connecté : il en devient le PDG (seul moyen de créer une entreprise).
    static async createOwn(body: CreateCompanyData): Promise<ApiCompany> {
        const { data } = await api.post("company/own", body);
        return data.data.company;
    }

    // Supprime (soft delete) une entreprise : réservé à son créateur, les membres redeviennent candidats.
    static async remove(id: number): Promise<void> {
        await api.delete(`company/${id}`);
    }
}
