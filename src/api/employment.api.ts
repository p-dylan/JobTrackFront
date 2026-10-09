import { api } from "../utils/axios-client";
import type { Employment } from "../types/employment.type";

export class EmploymentApi {
    // Récupère les emplois du user connecté, avec l'entreprise incluse.
    static async getMine(): Promise<Employment[]> {
        const { data } = await api.get("employment");
        return data;
    }
}
