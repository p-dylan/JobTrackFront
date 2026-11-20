import { api } from "../utils/axios-client";
import type { CompanyMember, Employment } from "../types/employment.type";
import type { RoleName } from "../constants/roles";

// Gestion des membres d'une entreprise : routes réservées au PDG / RH de cette entreprise.
export class CompanyMemberApi {
    // Membres validés de l'entreprise.
    static async getMembers(companyId: number): Promise<CompanyMember[]> {
        const { data } = await api.get(`company/${companyId}/members`);
        return data;
    }

    // Demandes d'adhésion en attente.
    static async getPending(companyId: number): Promise<CompanyMember[]> {
        const { data } = await api.get(`company/${companyId}/members/pending`);
        return data;
    }

    // Accepte une demande et attribue le rôle choisi.
    static async accept(companyId: number, userId: number, role: RoleName): Promise<Employment> {
        const { data } = await api.patch(`company/${companyId}/members/${userId}/accept`, { role });
        return data;
    }

    // Refuse une demande.
    static async reject(companyId: number, userId: number): Promise<Employment> {
        const { data } = await api.patch(`company/${companyId}/members/${userId}/reject`);
        return data;
    }

    // Change le rôle d'un membre (changement de poste).
    static async changeRole(companyId: number, userId: number, role: RoleName): Promise<Employment> {
        const { data } = await api.patch(`company/${companyId}/members/${userId}/role`, { role });
        return data;
    }

    // Licencie un membre (il redevient candidat).
    static async fire(companyId: number, userId: number): Promise<Employment> {
        const { data } = await api.delete(`company/${companyId}/members/${userId}`);
        return data;
    }
}
