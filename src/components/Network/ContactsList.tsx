import { ContactCard } from "./ContactCard";
import { useConnectionActions } from "../../hooks/useConnectionActions";
import type { PendingConnections, UserCard } from "../../types/connection.type";

type Props = {
    contacts: UserCard[];
    pending: PendingConnections;
};

// Onglet Contacts : invitations reçues / envoyées en haut, puis mes contacts
export function ContactsList({ contacts, pending }: Props) {
    const actions = useConnectionActions();
    const renderCards = (users: UserCard[]) =>
        users.map((user) => (
            <ContactCard
                key={user.id}
                user={user}
                isPending={actions.isPending}
                onRequest={actions.request}
                onAccept={actions.accept}
                onReject={actions.reject}
                onRemove={actions.remove}
            />
        ));

    return (
        <div className="flex flex-col gap-4">
            {pending.received.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-base-content/70">
                        Invitations reçues ({pending.received.length})
                    </h2>
                    {renderCards(pending.received)}
                </section>
            )}
            {pending.sent.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-base-content/70">
                        Invitations envoyées ({pending.sent.length})
                    </h2>
                    {renderCards(pending.sent)}
                </section>
            )}

            <section className="flex flex-col gap-2">
                {(pending.received.length > 0 || pending.sent.length > 0) && (
                    <h2 className="text-sm font-semibold text-base-content/70">Mes contacts ({contacts.length})</h2>
                )}
                {contacts.length === 0 ? (
                    <p className="border border-base-300 rounded-xl flex justify-center p-15 text-center">
                        Aucun contact.<br />Pour ajouter un contact, cliquez sur le bouton ci-dessous.
                    </p>
                ) : (
                    renderCards(contacts)
                )}
            </section>
        </div>
    );
}
