import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { UserApi } from "../api/user.api";
import { useAuthStore } from "../store/auth.store";
import { useToastStore } from "../store/toast.store";
import type { UpdateProfilData } from "../types/user.type";

// Envoie les modifs du profil (PATCH user/profil), met le store à jour puis revient au profil.
// Partagé par ProfileEdit et ProfileContactEdit.
export function useUpdateProfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfilData) => UserApi.updateProfil(data),
    onSuccess: (user, data) => {
      console.log("[profil] champs mis à jour :", Object.keys(data));
      useAuthStore.getState().setUser(user);
      queryClient.setQueryData(["user", "profil"], user);
      useToastStore.getState().addToast("Profil mis à jour", "success");
      navigate("/app/profile");
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour du profil :", error);
      useToastStore.getState().addToast("Erreur lors de la mise à jour du profil", "error");
    },
  });
}

// "" dans un champ texte = valeur effacée => null en BDD (sauf prénom/nom, obligatoires)
export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
