import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Loader2, UserRound } from "lucide-react";
import { Header } from "../../components/Layout/Header";
import { INPUT_CLASS, TEXTAREA_CLASS } from "../../constants/styles";
import { useAuthStore } from "../../store/auth.store";
import { emptyToNull, useUpdateProfil } from "../../hooks/useUpdateProfil";
import type { User } from "../../types/user.type";

// Attend que le user soit chargé, puis affiche le formulaire d'édition du profil.
export function ProfileEdit() {
  const user = useAuthStore((state) => state.user);

  // Au rechargement direct de la page, le user arrive après GET user/profil :
  // le formulaire n'est monté qu'une fois qu'il est disponible.
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

  return <ProfileEditForm user={user} />;
}

// Formulaire pré-rempli avec le profil actuel ; les champs vidés sont envoyés à null.
function ProfileEditForm({ user }: { user: User }) {
  const navigate = useNavigate();
  const updateProfil = useUpdateProfil();
  const [values, setValues] = useState({
    firstName: user.first_name,
    lastName: user.last_name,
    title: user.headline ?? "",
    location: user.location ?? "",
    bio: user.bio ?? "",
    availability: user.availability ?? "",
    jobType: user.job_type ?? "",
    salary: user.salary ?? "",
  });

  const handleChange =
    (field: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfil.mutate({
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      headline: emptyToNull(values.title),
      location: emptyToNull(values.location),
      bio: emptyToNull(values.bio),
      availability: emptyToNull(values.availability),
      job_type: emptyToNull(values.jobType),
      salary: emptyToNull(values.salary),
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
                <UserRound size={18} />
              </div>
              <h1 className="text-lg font-semibold">Modifier mon profil</h1>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-base-content/70 mb-1 block">
                    Prénom
                  </span>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={values.firstName}
                    onChange={handleChange("firstName")}
                    required
                    maxLength={100}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-base-content/70 mb-1 block">
                    Nom
                  </span>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={values.lastName}
                    onChange={handleChange("lastName")}
                    required
                    maxLength={100}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                  Titre
                </span>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={values.title}
                  onChange={handleChange("title")}
                />
              </label>

              <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                  Localisation
                </span>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={values.location}
                  onChange={handleChange("location")}
                />
              </label>

              <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                  Bio
                </span>
                <textarea
                  rows={3}
                  className={TEXTAREA_CLASS}
                  value={values.bio}
                  onChange={handleChange("bio")}
                />
              </label>

              <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                  Disponibilité
                </span>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={values.availability}
                  onChange={handleChange("availability")}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-base-content/70 mb-1 block">
                    Type de contrat
                  </span>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={values.jobType}
                    onChange={handleChange("jobType")}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-base-content/70 mb-1 block">
                    Salaire
                  </span>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={values.salary}
                    onChange={handleChange("salary")}
                  />
                </label>
              </div>

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
