import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConnectionApi } from "../api/connection.api";
import { useToastStore } from "../store/toast.store";
import { getApiErrorMessage } from "../utils/apiError";
import type { UserCard } from "../types/connection.type";

// Actions de mise en relation (inviter, accepter, refuser, retirer) + toasts + rechargement des listes
export function useConnectionActions() {
  const queryClient = useQueryClient();

  // Fabrique une mutation : appel API, toast de succès, recharge contacts / invitations / annuaire.
  const useAction = (call: (userId: number) => Promise<UserCard>, success: string, failure: string) =>
    useMutation({
      mutationFn: call,
      onSuccess: (user) => {
        console.log(`[relations] ${success} :`, user.id, user.connection_status);
        useToastStore.getState().addToast(success, "success");
        queryClient.invalidateQueries({ queryKey: ["connections"] });
        queryClient.invalidateQueries({ queryKey: ["connection_users"] });
      },
      onError: (error) => {
        console.error(failure, error);
        useToastStore.getState().addToast(getApiErrorMessage(error, failure), "error");
      },
    });

  const request = useAction(ConnectionApi.request, "Invitation envoyée", "Erreur lors de l'invitation");
  const accept = useAction(ConnectionApi.accept, "Invitation acceptée", "Erreur lors de l'acceptation");
  const reject = useAction(ConnectionApi.reject, "Invitation refusée", "Erreur lors du refus");
  const remove = useAction(ConnectionApi.remove, "Relation retirée", "Erreur lors du retrait");

  return {
    request: request.mutate,
    accept: accept.mutate,
    reject: reject.mutate,
    remove: remove.mutate,
    isPending: request.isPending || accept.isPending || reject.isPending || remove.isPending,
  };
}
