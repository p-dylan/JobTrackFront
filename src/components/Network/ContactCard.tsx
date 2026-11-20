import { Card } from "./Card";
import { Avatar } from "../UI/Avatar";
import { ConnectionActions } from "./ConnectionActions";
import { getFullName, getInitials } from "../../utils/userDisplay";
import type { UserCard } from "../../types/connection.type";

type Props = {
    user: UserCard;
    isPending: boolean;
    onRequest: (id: number) => void;
    onAccept: (id: number) => void;
    onReject: (id: number) => void;
    onRemove: (id: number) => void;
};

// Ligne d'un contact ou d'une invitation : identité, métier, entreprise + action selon l'état
export function ContactCard({ user, ...actions }: Props) {
    const job = user.job_title ?? user.headline;
    return (
        <Card>
            <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar label={getInitials(user)} size="sm" />
                    <div className="min-w-0">
                        <p className="font-medium truncate">{getFullName(user)}</p>
                        <p className="text-sm opacity-70 truncate">
                            {[job, user.company?.name].filter(Boolean).join(" · ") || "Métier non renseigné"}
                        </p>
                    </div>
                </div>
                <ConnectionActions user={user} allowRemove {...actions} />
            </div>
        </Card>
    );
}
