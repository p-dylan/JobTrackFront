import { useLocation, useNavigate } from "react-router";
import {
  Megaphone,
  BarChart3,
  User,
  Settings,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { MenuOverlay } from "./MenuOverlay";
import { MenuHeader } from "./MenuHeader";
import { MenuSection } from "./MenuSection";
import { MenuLink } from "./MenuLink";
import { ThemeToggle } from "../UI/ThemeToggle";
import { MAIN_NAV_ITEMS, isNavItemActive } from "../../constants/nav";
import { useAuthStore } from "../../store/auth.store";
import { useToastStore } from "../../store/toast.store";
import { AuthApi } from "../../api/auth.api";
import { getFullName, getInitials } from "../../utils/userDisplay";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

// Routes accessibles depuis la bottom nav : sur ces pages, "Retour" n'a pas
// de sens (on est déjà à la racine de la navigation principale). Dérivées de
// MAIN_NAV_ITEMS pour ne pas dupliquer cette liste à la main.
const MAIN_ROUTES = MAIN_NAV_ITEMS.map((item) => item.path);

export function SideMenu({ open, onClose }: SideMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  // user connecté (remis à jour depuis GET user/profil par useSyncCurrentUser)
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    // POST auth/logout : invalide le refresh token en BDD + supprime le cookie
    mutationFn: () => AuthApi.logout(),
    onSuccess: () => {
      console.log("[logout] déconnexion réussie côté serveur");
      useToastStore.getState().addToast("Vous avez bien été déconnecté", "success");
    },
    onError: (error) => {
      console.error("Erreur lors de la déconnexion :", error);
      useToastStore
        .getState()
        .addToast("Déconnexion locale effectuée, le serveur n'a pas répondu", "warning");
    },
    // Côté front on déconnecte dans tous les cas, même si le serveur n'a pas répondu.
    onSettled: () => {
      console.log("[logout] store et cache vidés, retour à la connexion");
      onClose();
      // navigation d'abord (démonte /app : sinon Root verrait "pas de token" et
      // relancerait un refresh au démarrage), puis on vide le store et le cache
      navigate("/");
      useAuthStore.getState().clearAuth();
      queryClient.clear();
    },
  });

  const isMainRoute = MAIN_ROUTES.some((path) =>
    isNavItemActive(location.pathname, path)
  );

  // Mêmes routes que la bottom nav (+ Profil, absent de la bottom nav faute
  // de place) : une seule source de vérité pour label/icône/path. "Actus"
  // reste à part, regroupé avec "Statistiques" ci-dessous (secondaryLinks).
  const mainLinks = [
    ...MAIN_NAV_ITEMS.filter((item) => item.path !== "/app/publications").map(
      ({ path, label, icon }) => ({ to: path, label, icon })
    ),
    { to: "/app/profile", label: "Profil", icon: User },
  ];

  const secondaryLinks = [
    { to: "/app/publications", label: "Actus", icon: Megaphone },
    { to: "/app/statistics", label: "Statistiques", icon: BarChart3 },
  ];

  return (
    <>
      <MenuOverlay open={open} onClose={onClose} />

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-base-100 border-r border-base-content/10 shadow-xl transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <MenuHeader
          name={getFullName(user)}
          email={user?.email ?? ""}
          initials={getInitials(user)}
          onClose={onClose}
        />

        {/* flex-1 (plutôt qu'une hauteur calculée à la main sur MenuHeader)
            occupe tout l'espace restant sans dépendre de sa hauteur exacte,
            et laisse le contenu s'empiler naturellement en haut : le vide
            éventuel reste en bas, jamais entre les groupes de liens. */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {!isMainRoute && (
            <ul className="menu menu-vertical w-full border-b border-base-content/10">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(-1);
                  }}
                  className="text-base-content"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
              </li>
            </ul>
          )}
          <MenuSection links={mainLinks} onLinkClick={onClose} />
          <MenuSection
            links={secondaryLinks}
            onLinkClick={onClose}
            title="Suivi"
          />

          <ul className="menu menu-vertical w-full py-4">
            <ThemeToggle />
            <MenuLink
              to="/app/settings"
              label="Paramètres"
              onClick={onClose}
              icon={Settings}
            />
            {/* bouton (et non lien) : il faut appeler le back avant de quitter la page */}
            <li>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-error hover:bg-error/10"
              >
                <LogOut className="w-4 h-4" />
                {logoutMutation.isPending ? "Déconnexion..." : "Déconnexion"}
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
