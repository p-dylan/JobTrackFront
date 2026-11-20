import type { RoleName } from "../constants/roles";

// État de la relation entre le user connecté et un autre user
export type ConnectionState = "none" | "sent" | "received" | "connected";

// Vignette publique d'un user (GET connection/users, connection, connection/pending)
export type UserCard = {
    id: number;
    first_name: string;
    last_name: string;
    headline: string | null;
    location: string | null;
    role: RoleName | null;
    job_title: string | null;
    company: { id: number; name: string } | null;
    connection_status: ConnectionState;
};

// Invitations en attente du user connecté
export type PendingConnections = {
    received: UserCard[];
    sent: UserCard[];
};
