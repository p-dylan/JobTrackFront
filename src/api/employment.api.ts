import { api } from "../utils/axios-client";
import type { CreateEmploymentData, Employment } from "../types/employment.type";

export class EmploymentApi {
    // Récupère les emplois du user connecté, avec l'entreprise incluse.
    static async getMine(): Promise<Employment[]> {
        const { data } = await api.get("employment");
        return data;
    }

    // Envoie une demande d'adhésion (is_current = true => PENDING, à valider par PDG/RH).
    static async requestJoin(companyId: number, jobTitle: string): Promise<Employment> {
        const body: CreateEmploymentData = {
            company_id: companyId,
            job_title: jobTitle,
            start_date: new Date().toISOString().slice(0, 10),
            is_current: true,
        };
        const { data } = await api.post("employment", body);
        return data;
    }

    // Quitte l'entreprise actuelle (le back repasse le user en candidat).
    static async leave(companyId: number): Promise<Employment> {
        const { data } = await api.patch(`employment/${companyId}`, { is_current: false });
        return data;
    }

    // Supprime un emploi : sert à annuler une demande d'adhésion en attente.
    static async remove(companyId: number): Promise<void> {
        await api.delete(`employment/${companyId}`);
    }
}
