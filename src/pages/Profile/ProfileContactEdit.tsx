import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Contact as ContactIcon, Loader2 } from "lucide-react";
import { Header } from "../../components/Layout/Header";
import { INPUT_CLASS } from "../../constants/styles";
import { useAuthStore } from "../../store/auth.store";
import { emptyToNull, useUpdateProfil } from "../../hooks/useUpdateProfil";
import type { User } from "../../types/user.type";

// Attend que le user soit chargé, puis affiche le formulaire des contacts.
export function ProfileContactEdit() {
  const user = useAuthStore((state) => state.user);

  // Formulaire monté seulement une fois le user chargé (rechargement direct).
  if (!user) {
    return (
      <>
        <Header />
        <div className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
        </div>
      </>
    );
  }

  return <ProfileContactEditForm user={user} />;
}

// Formulaire téléphone / site / LinkedIn / GitHub (l'email reste en lecture seule).
function ProfileContactEditForm({ user }: { user: User }) {
  const navigate = useNavigate();
  const updateProfil = useUpdateProfil();
  // email : identifiant de connexion, affiché en lecture seule
  const [values, setValues] = useState({
    phone: user.phone ?? "",
    website: user.website ?? "",
    linkedin: user.linkedin ?? "",
    github: user.github ?? "",
  });

  const handleChange =
    (field: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfil.mutate({
      phone: emptyToNull(values.phone),
      website: emptyToNull(values.website),
      linkedin: emptyToNull(values.linkedin),
      github: emptyToNull(values.github),
    });
  };

  return (
    <>
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button
          onClick={() => navigate("/app/profile")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-base-content/60 hover:text-base-content"
        >
          <ArrowLeft size={16} />
          Retour au profil
        </button>

        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ContactIcon size={18} />
              </div>
              <h1 className="text-lg font-semibold">Modifier mes contacts</h1>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                  Email
                </span>
                <input
                  type="email"
                  className={INPUT_CLASS}
                  value={user.email}
                  readOnly
                  disabled
                />
                <span className="text-xs text-base-content/50 mt-1 block">
                  L'email sert d'identifiant de connexion et ne peut pas être modifié ici.
                </span>
              </label>

              <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                  Téléphone
                </span>
                <input
                  type="tel"
                  className={INPUT_CLASS}
                  value={values.phone}
                  onChange={handleChange("phone")}
                />
              </label>

              <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                  Site web
                </span>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={values.website}
                  onChange={handleChange("website")}
                />
              </label>

              <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                  LinkedIn
                </span>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={values.linkedin}
                  onChange={handleChange("linkedin")}
                />
              </label>

              <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                  GitHub
                </span>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={values.github}
                  onChange={handleChange("github")}
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary mt-2"
                disabled={updateProfil.isPending}
              >
                {updateProfil.isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
