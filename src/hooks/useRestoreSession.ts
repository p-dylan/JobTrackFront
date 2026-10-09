import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AuthApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { useToastStore } from "../store/toast.store";

// Au rechargement, récupère un access token via le cookie refresh AVANT toute
// autre requête : plus de 401 visible. Renvoie true quand la session est prête.
export function useRestoreSession(): boolean {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);

  // useQuery (et pas un simple appel) : les appels simultanés sont fusionnés
  // (StrictMode monte 2 fois) => un seul refresh, sinon le 2e échouerait.
  const { data, isError } = useQuery({
    queryKey: ["session", "restore"],
    queryFn: () => {
      console.log("[session] pas de token en mémoire, refresh au démarrage...");
      return AuthApi.refresh();
    },
    enabled: !accessToken, // déjà connecté (ex: juste après le login) => rien à faire
    retry: false,
    staleTime: Infinity,
  });

  // Refresh réussi : on range le token et le user dans le store.
  useEffect(() => {
    if (data && !accessToken) {
      console.log("[session] session restaurée pour :", data.user.email);
      useAuthStore.getState().setAccessToken(data.accessToken);
      useAuthStore.getState().setUser(data.user);
    }
  }, [data, accessToken]);

  // Refresh impossible (cookie absent ou expiré) : retour à la connexion.
  useEffect(() => {
    if (isError && !accessToken) {
      console.log("[session] aucune session valide, retour à la connexion");
      useToastStore.getState().addToast("Session expirée, veuillez vous reconnecter", "info");
      navigate("/");
    }
  }, [isError, accessToken, navigate]);

  return !!accessToken;
}
