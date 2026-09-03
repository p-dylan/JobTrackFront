export type User = {
    id: number;
    role_id: number | null;
    email: string;
    first_name: string;
    last_name: string;
    notifications_enabled: boolean;
    language: string;
}