import { api } from "../utils/axios-client";
import type { Paginated } from "../types/company.types";
import type { PendingConnections, UserCard } from "../types/connection.type";

// Mise en relation entre users : toutes les routes agissent pour le user connecté.
export class ConnectionApi {
    // Annuaire paginé (modale "Ajouter un contact"), recherche par métier / nom / ville.
    static async searchUsers(params: { search?: string; skip: number; take: number }): Promise<Paginated<UserCard>> {
        const { data } = await api.get("connection/users", { params });
        return data;
    }

    // Mes contacts (relations acceptées).
    static async getContacts(): Promise<UserCard[]> {
        const { data } = await api.get("connection");
        return data;
    }

    // Invitations reçues et envoyées en attente.
    static async getPending(): Promise<PendingConnections> {
        const { data } = await api.get("connection/pending");
        return data;
    }

    // Invite un user (acceptée directement s'il m'avait déjà invité).
    static async request(userId: number): Promise<UserCard> {
        const { data } = await api.post("connection", { user_id: userId });
        return data;
    }

    // Accepte l'invitation reçue de ce user.
    static async accept(userId: number): Promise<UserCard> {
        const { data } = await api.patch(`connection/${userId}/accept`);
        return data;
    }

    // Refuse l'invitation reçue de ce user.
    static async reject(userId: number): Promise<UserCard> {
        const { data } = await api.patch(`connection/${userId}/reject`);
        return data;
    }

    // Retire un contact ou annule une invitation envoyée.
    static async remove(userId: number): Promise<UserCard> {
        const { data } = await api.delete(`connection/${userId}`);
        return data;
    }
}
