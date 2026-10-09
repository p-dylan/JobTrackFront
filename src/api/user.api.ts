import type { UpdateProfilData, User } from "../types/user.type";
import { api } from "../utils/axios-client";

export class UserApi {
    // Récupère le user connecté (le back le déduit du token).
    static async getProfil(): Promise<User> {
        const { data } = await api.get("user/profil");
        return data;
    }

    // Modifie le profil du user connecté (prénom, nom, bio, contacts...).
    static async updateProfil(body: UpdateProfilData): Promise<User> {
        const { data } = await api.patch("user/profil", body);
        return data;
    }

    // Récupère un user par son id (ex: nom d'un candidat).
    static async getOne(id: number): Promise<User> {
        const { data } = await api.get(`user/${id}`);
        return data;
    }

    // Supprime le compte du user connecté.
    static async deleteAccount(): Promise<void> {
        await api.delete("user/account");
    }

    // Change la langue du user connecté.
    static async updateLanguage(language: "fr" | "en" | "de" | "es"): Promise<User> {
        const {data} = await api.patch("user/settings/language", {language});
        return data;
    }

    // Active ou désactive les notifications du user connecté.
    static async updateNotifications(enabled: boolean): Promise<User> {
        const { data} = await api.patch("user/settings/notifications", { notifications_enabled: enabled });
        return data;
    }
}
