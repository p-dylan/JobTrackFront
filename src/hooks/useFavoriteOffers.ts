import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { JobOfferingApi } from "../api/job_offering.api";
import { useToastStore } from "../store/toast.store";

const FAVORITES_KEY = ["job_offerings", "favorites"];

// Charge les favoris du user et fournit le clic sur le cœur (liste + page détail).
export function useFavoriteOffers() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: FAVORITES_KEY,
    // le ms pagine toujours : take large pour récupérer tous les favoris
    queryFn: () => JobOfferingApi.getAll({ favoritesOnly: true, take: 100 }),
  });

  const favorites = data?.data ?? [];
  const savedIds = favorites.map((offer) => offer._id);

  const toggleMutation = useMutation({
    mutationFn: (offerId: string) =>
      savedIds.includes(offerId)
        ? JobOfferingApi.removeFavorite(offerId)
        : JobOfferingApi.addFavorite(offerId),
    onSuccess: (_data, offerId) => {
      const wasSaved = savedIds.includes(offerId);
      console.log(`[favoris] offre ${offerId} ${wasSaved ? "retirée" : "ajoutée"}`);
      useToastStore
        .getState()
        .addToast(wasSaved ? "Offre retirée des favoris" : "Offre sauvegardée", "success");
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour des favoris :", error);
      useToastStore.getState().addToast("Erreur lors de la mise à jour des favoris", "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  });

  return {
    favorites,
    savedIds,
    isLoading,
    // Ajoute l'offre aux favoris si elle n'y est pas, sinon la retire.
    toggleFavorite: (offerId: string) => toggleMutation.mutate(offerId),
  };
}
