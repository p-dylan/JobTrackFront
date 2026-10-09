import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { SettingsModal } from "../../components/Settings/SettingsModal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { FieldError } from "../../components/Auth/FieldError";
import { Header } from "../../components/Layout/Header";
import { type ChangePasswordValues, changePasswordSchema } from "../../schemas/settings.schemas";
import { INPUT_CLASS } from "../../constants/styles";
import { AuthApi } from "../../api/auth.api";
import { useAuthStore } from "../../store/auth.store";

export function SettingsPassword() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const successModalRef = useRef<HTMLDialogElement>(null)
  const user = useAuthStore((state) => state.user);
  

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  if (!user) return null //user pas encore chargé on ne peut pas afficher

  const onSubmit = async (values: ChangePasswordValues) => {
    setServerError(null);
    try {
      // confirmPassword reste côté front : le DTO back (forbidNonWhitelisted) le rejetterait
      await AuthApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      console.log("[mot de passe] modifié avec succès");
      successModalRef.current?.showModal();
    } catch (err) {
      console.error("Erreur lors du changement de mot de passe :", err);
      setServerError("Une erreur est survenue. Vérifie ton mot de passe actuel.");
    }
  };

  return (
    <>
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button
          onClick={() => navigate("/app/settings")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-base-content/60 hover:text-base-content"
        >
          <ArrowLeft size={16} />
          Retour aux paramètres
        </button>

        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock size={18} />
              </div>
              <h1 className="text-lg font-semibold">Changer le mot de passe</h1>
            </div>
            {user.has_password ? (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <label className="block">
                    <span className="text-sm text-base-content/70 mb-1 block">
                      Mot de passe actuel
                    </span>
                    <input
                      type="password"
                      autoComplete="current-password"
                      className={INPUT_CLASS}
                      {...register("currentPassword")}
                  />
                  <FieldError error={errors.currentPassword?.message} />
                </label>

                <label className="block">
                  <span className="text-sm text-base-content/70 mb-1 block">
                    Nouveau mot de passe
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={INPUT_CLASS}
                    {...register("newPassword")}
                  />
                  <FieldError error={errors.newPassword?.message} />
                </label>

                <label className="block">
                  <span className="text-sm text-base-content/70 mb-1 block">
                    Confirmer le nouveau mot de passe
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={INPUT_CLASS}
                    {...register("confirmPassword")}
                  />
                  <FieldError error={errors.confirmPassword?.message} />
                </label>

                {serverError && <p className="text-sm text-error">{serverError}</p>}

                <button type="submit" className="btn btn-primary mt-2" disabled={isSubmitting}>
                  {isSubmitting ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-base-content/70">
                Votre compte est connecté via Google : il n'a pas de mot de passe à modifier.
              </p>
            )}
          </div>
        </div>
      </div>

      <SettingsModal modalRef={successModalRef} title="Mot de passe mis à jour">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CheckCircle2 className="text-success" size={40} />
          <p className="text-sm text-base-content/70">
            Ton mot de passe a bien été modifié.
          </p>
          <button
            className="btn btn-primary mt-2"
            onClick={() => navigate("/app/settings")}
          >
            Retour aux paramètres
          </button>
        </div>
      </SettingsModal>
    </>
  );
}