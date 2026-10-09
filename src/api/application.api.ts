import { api } from "../utils/axios-client";
import type { Application, UpdatableApplicationStatus } from "../types/application.type";

export class ApplicationApi {
    // Envoie une candidature du user connecté sur une offre.
    static async apply(jobOfferingId: string): Promise<Application> {
        const { data } = await api.post("application", { job_offering_id: jobOfferingId });
        return data;
    }

    // Récupère les candidatures envoyées par le user connecté.
    static async getMine(): Promise<Application[]> {
        const { data } = await api.get("application/candidate");
        return data;
    }

    // Récupère les candidatures reçues par l'entreprise du recruteur connecté.
    static async getReceived(): Promise<Application[]> {
        const { data } = await api.get("application/received");
        return data;
    }

    // Récupère une candidature par son id.
    static async getOne(id: number): Promise<Application> {
        const { data } = await api.get(`application/${id}`);
        return data;
    }

    // Change le statut d'une candidature (accepter, refuser ou retirer).
    static async updateStatus(id: number, status: UpdatableApplicationStatus): Promise<Application> {
        const { data } = await api.patch(`application/${id}/status`, { status });
        return data;
    }
}
