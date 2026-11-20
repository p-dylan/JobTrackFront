import type { RoleName } from "../constants/roles";

export type User = {
    id: number;
    role_id: number | null;
    // nom du rôle renvoyé par le back (null = compte ancien sans rôle)
    role: RoleName | null;
    email: string;
    first_name: string;
    last_name: string;
    has_password: boolean;
    notifications_enabled: boolean;
    language: string;
    // infos de profil (optionnelles en BDD)
    headline: string | null;
    location: string | null;
    bio: string | null;
    availability: string | null;
    job_type: string | null;
    salary: string | null;
    phone: string | null;
    website: string | null;
    linkedin: string | null;
    github: string | null;
}

// Body de PATCH /user/profil (ni email, ni mot de passe)
export type UpdateProfilData = Partial<
    Pick<
        User,
        | "first_name"
        | "last_name"
        | "headline"
        | "location"
        | "bio"
        | "availability"
        | "job_type"
        | "salary"
        | "phone"
        | "website"
        | "linkedin"
        | "github"
    >
>;
