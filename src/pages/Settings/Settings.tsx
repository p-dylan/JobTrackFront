import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
    Bell,
    Globe,
    Lock,
    ShieldCheck,
    HelpCircle,
    Info,
    Settings as SettingsIcon,
} from "lucide-react";
import ProfileCard from "../../components/Settings/SettingsProfilCard";
import { SettingsSection } from "../../components/Settings/SettingsSection";
import SettingsItem from "../../components/Settings/SettingsItem";
import { SettingsModal } from "../../components/Settings/SettingsModal";
import { Header } from "../../components/Layout/Header";
import { PageContainer } from "../../components/Layout/PageContainer";
import { PageTitle } from "../../components/Layout/PageTitle";
import { INPUT_CLASS } from "../../constants/styles";
import { UserApi } from "../../api/user.api";
import { useAuthStore } from "../../store/auth.store";
import { useToastStore } from "../../store/toast.store";

interface UserSettings {
    notifications: boolean;
    language: "fr" | "en" | "de" | "es";
}

export function Settings() {
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);

    const [settings, setSettings] = useState<UserSettings>({
        notifications: true,
        language: "fr",
    });
    const [twoFA] = useState(false);

    const aboutModalRef = useRef<HTMLDialogElement>(null);
    const deleteModalRef = useRef<HTMLDialogElement>(null);

    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const handleDeleteAccount = async () => {
        try {
            //api call to delete account
            await UserApi.deleteAccount();
            // close modal
            deleteModalRef.current?.close();
            // clear auth state
            useAuthStore.getState().clearAuth();
            // redirect to login page
            navigate("/login");
        } catch (error) {
            console.error("Erreur lors de la suppression du compte :", error);
        }
    };
    // Handle notifications toggle
    const handleToggleNotifications = async (checked: boolean) => {
        const previousValue = settings.notifications;

        try {
            // Update the state optimistically
            setSettings((s) => ({
                ...s,
                notifications: checked,
            }));
            // Call the API to update the notifications setting
            await UserApi.updateNotifications(checked);

            useToastStore
                .getState()
                .addToast(
                    `Notifications ${checked ? "activées" : "désactivées"}`,
                    "success",
                );
        } catch (error) {
            console.error(
                "Erreur lors de la mise à jour des notifications :",
                error,
            );
            // Revert to previous value in case of error
            setSettings((s) => ({
                ...s,
                notifications: previousValue,
            }));
            useToastStore
                .getState()
                .addToast(
                    "Erreur lors de la mise à jour des notifications",
                    "error",
                );
        }
    };
    // Handle language change
    const handleChangeLanguage = async (
        language: "fr" | "en" | "de" | "es",
    ) => {
        const previousLanguage = settings.language;

        try {
            // Update the state optimistically
            setSettings((s) => ({
                ...s,
                language: language,
            }));
            // Call the API to update the language setting
            await UserApi.updateLanguage(language);
            // Show a success toast
            useToastStore
                .getState()
                .addToast(`Langue mise à jour vers ${language}`, "success");
        } catch (error) {
            console.error(
                "Erreur lors de la mise à jour de la langue :",
                error,
            );
            // Revert to previous value in case of error
            setSettings((s) => ({
                ...s,
                language: previousLanguage,
            }));
            useToastStore
                .getState()
                .addToast(
                    "Erreur lors de la mise à jour de la langue",
                    "error",
                );
        }
    };

    return (
        <>
            <div className="flex-1 flex flex-col">
                <Header />
                <PageContainer className="pt-3 space-y-2 flex-1 flex flex-col">
                    <PageTitle
                        title="Paramètres"
                        description="Gérez votre compte et vos préférences"
                        icon={SettingsIcon}
                    />

                    <div className="-mx-4 sm:mx-0">
                        <div className="flex flex-col divide-y divide-base-300">
                            <ProfileCard
                                first_name={user?.first_name ?? ""}
                                last_name={user?.last_name ?? ""}
                                email={user?.email ?? ""}
                                onEdit={() => navigate("/app/profile/edit")}
                            />

                            <SettingsSection title="Préférences">
                                {/* Ligne Notifications — inline */}
                                <div className="flex w-full items-center justify-between bg-base-100 px-4 py-4 border-b border-base-200 last:border-b-0">
                                    <span className="flex items-center gap-3">
                                        <span className="text-base-content/60">
                                            <Bell size={18} />
                                        </span>
                                        <span className="font-medium text-base-content">
                                            <span className="sm:hidden">
                                                Notifications
                                            </span>
                                            <span className="hidden sm:inline">
                                                Recevoir les notifications
                                            </span>
                                        </span>
                                    </span>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                        checked={settings.notifications}
                                        onChange={(e) =>
                                            handleToggleNotifications(
                                                e.target.checked,
                                            )
                                        }
                                    />
                                </div>

                                {/* Ligne Langue — inline, dropdown natif stylisé */}
                                <div className="flex w-full items-center justify-between bg-base-100 px-4 py-4 border-b border-base-200 last:border-b-0">
                                    <span className="flex items-center gap-3">
                                        <span className="text-base-content/60">
                                            <Globe size={18} />
                                        </span>
                                        <span className="font-medium text-base-content">
                                            Langue
                                        </span>
                                    </span>
                                    <select
                                        className="select select-ghost select-md w-auto px-10 text-right font-normal text-base-content/50 focus:outline-none"
                                        value={settings.language}
                                        onChange={(e) =>
                                            handleChangeLanguage(
                                                e.target.value as
                                                    | "fr"
                                                    | "en"
                                                    | "de"
                                                    | "es",
                                            )
                                        }
                                    >
                                        <option value="fr">Français</option>
                                        <option value="en">English</option>
                                        <option value="de">Deutsch</option>
                                        <option value="es">Español</option>
                                    </select>
                                </div>
                            </SettingsSection>

                            <SettingsSection title="Sécurité">
                                <SettingsItem
                                    icon={<Lock size={18} />}
                                    label="Mot de passe"
                                    onClick={() =>
                                        navigate("/app/settings/password")
                                    }
                                />
                                <SettingsItem
                                    icon={<ShieldCheck size={18} />}
                                    label="Authentification 2FA"
                                    value={twoFA ? "Activée" : "Désactivée"}
                                    onClick={() =>
                                        navigate("/app/settings/2fa")
                                    }
                                />
                            </SettingsSection>

                            <SettingsSection title="Support">
                                <SettingsItem
                                    icon={<HelpCircle size={18} />}
                                    label="Centre d'aide"
                                    onClick={() =>
                                        navigate("/app/settings/help")
                                    }
                                />
                                <SettingsItem
                                    icon={<Info size={18} />}
                                    label="À propos"
                                    value="Version 1.0.0"
                                    onClick={() =>
                                        aboutModalRef.current?.showModal()
                                    }
                                />
                            </SettingsSection>
                        </div>
                    </div>

                    <button
                        onClick={() => deleteModalRef.current?.showModal()}
                        className="btn btn-error btn-soft w-full mt-6"
                    >
                        Supprimer mon compte
                    </button>
                </PageContainer>
            </div>

            <SettingsModal modalRef={aboutModalRef} title="À propos">
                <p className="text-sm text-base-content/70">Version 1.0.0</p>
            </SettingsModal>

            <dialog ref={deleteModalRef} className="modal">
                <div className="modal-box">
                    <h3 className="text-lg font-bold text-error">
                        Supprimer votre compte ?
                    </h3>
                    <p className="py-4 text-sm text-base-content/70">
                        Cette action est irréversible. Toutes vos données seront
                        définitivement supprimées. Tape{" "}
                        <span className="font-semibold">SUPPRIMER</span> pour
                        confirmer.
                    </p>
                    <input
                        type="text"
                        className={INPUT_CLASS}
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="SUPPRIMER"
                    />
                    <div className="modal-action">
                        <form method="dialog">
                            <button
                                className="btn"
                                onClick={() => setDeleteConfirmText("")}
                            >
                                Annuler
                            </button>
                        </form>
                        <button
                            className="btn btn-error"
                            disabled={deleteConfirmText !== "SUPPRIMER"}
                            onClick={handleDeleteAccount}
                        >
                            Supprimer définitivement
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
}
