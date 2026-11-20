import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CompanyApi } from "../api/company.api";
import { useToastStore } from "../store/toast.store";
import { getApiErrorMessage } from "../utils/apiError";

// Suivre / ne plus suivre une entreprise (direct, sans demande) + recharge les listes d'entreprises
export function useFollowCompany() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, follow }: { id: number; follow: boolean }) =>
      follow ? CompanyApi.follow(id) : CompanyApi.unfollow(id),
    onSuccess: (company) => {
      console.log("[relations] suivi entreprise :", company.id, company.is_followed);
      useToastStore
        .getState()
        .addToast(company.is_followed ? `Vous suivez ${company.name}` : `Vous ne suivez plus ${company.name}`, "success");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error) => {
      console.error("Erreur lors du suivi de l'entreprise :", error);
      useToastStore.getState().addToast(getApiErrorMessage(error, "Erreur lors du suivi de l'entreprise"), "error");
    },
  });

  return {
    toggleFollow: (id: number, follow: boolean) => mutation.mutate({ id, follow }),
    isPending: mutation.isPending,
  };
}
