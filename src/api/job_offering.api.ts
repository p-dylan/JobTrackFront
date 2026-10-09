import { api } from "../utils/axios-client";
import type {
    CreateJobOfferingData,
    FindJobOfferingsParams,
    JobOffering,
    PaginatedJobOfferings,
    UpdateJobOfferingData,
} from "../types/job_offering.type";

// Gateway job-searchBack /job_offering => NATS => ms_job_offering
export class JobOfferingApi {
    // Récupère une page d'offres filtrées (recherche, catégorie, favoris...).
    static async getAll(params: FindJobOfferingsParams = {}): Promise<PaginatedJobOfferings> {
        // axios retire les params undefined et convertit les booléens en "true"/"false"
        const { data } = await api.get("job_offering", { params });
        return data;
    }

    // Récupère une seule offre par son id Mongo.
    static async getOne(id: string): Promise<JobOffering> {
        const { data } = await api.get(`job_offering/${id}`);
        return data;
    }

    // Publie une offre pour l'entreprise du recruteur connecté.
    static async create(body: CreateJobOfferingData): Promise<JobOffering> {
        const { data } = await api.post("job_offering", body);
        return data;
    }

    // Modifie une offre de son entreprise.
    static async update(id: string, body: UpdateJobOfferingData): Promise<JobOffering> {
        const { data } = await api.patch(`job_offering/${id}`, body);
        return data;
    }

    // Supprime une offre (suppression logique côté ms, restaurable).
    static async remove(id: string): Promise<JobOffering> {
        const { data } = await api.delete(`job_offering/${id}`);
        return data;
    }

    // Restaure une offre supprimée.
    static async restore(id: string): Promise<JobOffering> {
        const { data } = await api.patch(`job_offering/${id}/restore`);
        return data;
    }

    // Ajoute l'offre aux favoris du user connecté.
    static async addFavorite(id: string): Promise<void> {
        await api.post(`job_offering/${id}/favorite`);
    }

    // Retire l'offre des favoris du user connecté.
    static async removeFavorite(id: string): Promise<void> {
        await api.delete(`job_offering/${id}/favorite`);
    }
}
