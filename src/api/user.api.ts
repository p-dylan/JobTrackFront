import type { User } from "../types/user.type";
import { api } from "../utils/axios-client";

export class UserApi {
    static async deleteAccount(): Promise<void> {
        await api.delete("user/account");
    }

    static async updateLanguage(language: "fr" | "en" | "de" | "es"): Promise<User> {
        const {data} = await api.patch("user/settings/language", {language});
        return data;
    }

    static async updateNotifications(enabled: boolean): Promise<User> {
        const { data} = await api.patch("user/settings/notifications", { notifications_enabled: enabled });
        return data;
    }
}