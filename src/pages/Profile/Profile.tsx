import { useNavigate } from "react-router";
import { Loader2, User } from "lucide-react";
import { Header } from "../../components/Layout/Header";
import { PageContainer } from "../../components/Layout/PageContainer";
import { PageTitle } from "../../components/Layout/PageTitle";

import { ProfileIdentity } from "../../components/Profile/ProfileIdentity";
import { ProfileContact } from "../../components/Profile/Contact";
import { ProfileSkills } from "../../components/Profile/Skill";
import { useAuthStore } from "../../store/auth.store";
import { useCurrentEmployment } from "../../hooks/useCurrentEmployment";
import { getInitials } from "../../utils/userDisplay";

// Page profil : infos du user connecté (store) + poste de l'emploi actuel si pas de titre.
export function Profile() {
  const navigate = useNavigate();
  // user connecté, tenu à jour depuis GET user/profil (useSyncCurrentUser)
  const user = useAuthStore((state) => state.user);
  const { employment } = useCurrentEmployment();

  if (!user) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
        </div>
      </div>
    );
  }

  // Titre saisi par le user, sinon le poste de son emploi actuel.
  const title =
    user.headline ?? (employment ? `${employment.job_title} · ${employment.company.name}` : null);

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <PageContainer className="pt-3 space-y-2 flex-1 flex flex-col">
        <PageTitle
          title="Mon profil"
          description="Vos informations visibles par les recruteurs"
          icon={User}
        />

        <div className="-mx-4 sm:mx-0 mt-3">
          <ProfileIdentity
            user={{
              firstName: user.first_name,
              lastName: user.last_name,
              initials: getInitials(user),
              title,
              role: user.role,
              location: user.location,
              bio: user.bio,
              availability: user.availability,
              jobType: user.job_type,
              salary: user.salary,
            }}
            onEdit={() => navigate("/app/profile/edit")}
          />
          <ProfileContact
            user={user}
            onAdd={() => navigate("/app/profile/contact/edit")}
          />
          {/* module compétences pas encore implémenté côté back */}
          <ProfileSkills
            skills={[]}
            onAdd={() => navigate("/app/profile/skills/edit")}
          />
        </div>
      </PageContainer>
    </div>
  );
}
