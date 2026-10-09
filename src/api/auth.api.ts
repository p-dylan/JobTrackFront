import type { ChangePasswordData, SignInData, SignUpData } from "../types/auth.type";
import type { User } from "../types/user.type";
import { api } from "../utils/axios-client";
import axios from "axios";

//futur add : lastLoginAt(derniere connexion le ...)
export type LoginResponse = {
    accessToken: string; 
    user: User
};

export type RefreshResponse = {
    accessToken: string; 
    user: User
};

export class AuthApi {

    static async googleLogin(credential: string) {
        const { data } = await api.post("auth/google", { credential });
        return data; //{ accessToken, user}
    }

    static async login(body: SignInData): Promise<LoginResponse> {
        const { data } = await api.post("auth/login", body);
        return data;
    }

    static async register(body: SignUpData): Promise<User> {
        const { data } = await api.post("auth/register", body);
        return data;
    }

    static async refresh(): Promise<RefreshResponse> {
        const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            {},
            { withCredentials: true }
        );
        return data;
    }

    // Déconnecte : le back efface le refresh token en BDD et supprime le cookie.
    static async logout(): Promise<void> {
        await api.post("auth/logout", {}, { withCredentials: true });
    }

    // Change le mot de passe (le back vérifie d'abord l'ancien).
    static async changePassword(body: ChangePasswordData): Promise<{ message: string }> {
        const { data } = await api.patch("auth/password", body);
        return data;
    }
}