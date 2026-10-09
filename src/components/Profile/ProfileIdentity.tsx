import { useRef, useState } from "react";
import { MapPin, Edit2, Camera } from "lucide-react";

// Champs optionnels en BDD : null = non renseigné, masqué à l'affichage.
interface UserType {
  firstName: string;
  lastName: string;
  initials: string;
  title: string | null;
  location: string | null;
  bio: string | null;
  availability: string | null;
  jobType: string | null;
  salary: string | null;
}

interface ProfileIdentityProps {
  user: UserType;
  onEdit?: () => void;
}

// Aperçu instantané côté client (pas de backend d'upload pour l'instant).
// Révoque l'ancienne blob URL pour éviter les fuites mémoire.
function previewImage(
  file: File,
  current: string,
  setSrc: (url: string) => void
) {
  if (current.startsWith("blob:")) URL.revokeObjectURL(current);
  setSrc(URL.createObjectURL(file));
}

export function ProfileIdentity({ user, onEdit }: ProfileIdentityProps) {
  // pas de photo en BDD : initiales par défaut, aperçu local si l'utilisateur en choisit une
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [bannerSrc, setBannerSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) previewImage(file, bannerSrc ?? "", setBannerSrc);
    e.target.value = "";
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) previewImage(file, avatarSrc ?? "", setAvatarSrc);
    e.target.value = "";
  };

  return (
    <>
      {/* 1. Zone de Couverture */}
      <div className="relative h-34 sm:h-56 overflow-hidden bg-linear-to-r from-primary to-secondary">
        {bannerSrc && (
          <img
            src={bannerSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerChange}
        />
        <button
          onClick={() => bannerInputRef.current?.click()}
          aria-label="Changer la photo de bannière"
          className="absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center bg-base-200 hover:bg-base-300 text-base-content/80 hover:text-base-content transition-colors cursor-pointer"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Contenu des détails de l'identité */}
      <div className="relative pt-12 px-4 pb-5 bg-base-100 -mt-4">
        {/* DaisyUI Avatar Container décalé vers le haut */}
        <div className="absolute left-4 -top-14 avatar placeholder">
          <div className="w-24 h-24 rounded-full ring-4 ring-base-100 shadow-md overflow-hidden bg-base-300">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Avatar"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center bg-primary text-primary-content text-2xl font-semibold">
                {user.initials}
              </span>
            )}
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            aria-label="Changer la photo de profil"
            className="absolute -right-1 -bottom-1 w-7 h-7 rounded-full border-2 border-base-100 flex items-center justify-center bg-base-200 hover:bg-base-300 text-base-content/80 hover:text-base-content transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Bloc d'informations textuelles */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-base-content">
              {user.firstName} {user.lastName}
            </h2>
            <button
              onClick={onEdit}
              className="btn btn-sm shrink-0 gap-1.5 mt-1.5 bg-base-200 hover:bg-base-300 text-base-content/80 hover:text-base-content border-none transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Modifier
            </button>
          </div>
          {user.title && (
            <p className="text-sm text-base-content/70 font-medium">
              {user.title}
            </p>
          )}
          {user.location && (
            <div className="flex items-center gap-1 text-base-content/50 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{user.location}</span>
            </div>
          )}
        </div>

        {/* Biographie */}
        {user.bio ? (
          <p className="mt-2 text-sm text-base-content/80 leading-relaxed whitespace-pre-line">
            {user.bio}
          </p>
        ) : (
          <p className="mt-2 text-sm text-base-content/50 italic">
            Ajoutez une bio via « Modifier » pour vous présenter aux recruteurs.
          </p>
        )}

        {/* Badges DaisyUI */}
        {(user.availability || user.jobType || user.salary) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {user.availability && (
              <div className="badge badge-success badge-soft font-medium">
                {user.availability}
              </div>
            )}
            {user.jobType && (
              <div className="badge badge-primary badge-soft font-medium">
                {user.jobType}
              </div>
            )}
            {user.salary && (
              <div className="badge badge-soft font-medium">
                {user.salary}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
