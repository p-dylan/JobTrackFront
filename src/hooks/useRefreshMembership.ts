import { useQueryClient } from "@tanstack/react-query";

// Recharge profil (rôle), emplois et membres après une action qui peut changer le rôle du user
// (création d'entreprise, départ, acceptation, licenciement...).
export function useRefreshMembership() {
  const queryClient = useQueryClient();

  return () => {
    console.log("[membership] rechargement profil / emplois / membres");
    queryClient.invalidateQueries({ queryKey: ["user", "profil"] });
    queryClient.invalidateQueries({ queryKey: ["employment"] });
    queryClient.invalidateQueries({ queryKey: ["company_members"] });
    queryClient.invalidateQueries({ queryKey: ["companies"] });
  };
}
