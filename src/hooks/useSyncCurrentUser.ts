import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserApi } from "../api/user.api";
import { useAuthStore } from "../store/auth.store";

// Recharge le user connecté depuis la BDD et le range dans le store zustand.
// Attend que useRestoreSession ait remis un token (sinon 401 inutile).
export function useSyncCurrentUser() {
  const accessToken = useAuthStore((state) => state.accessToken);

  const { data } = useQuery({
    queryKey: ["user", "profil"],
    queryFn: () => UserApi.getProfil(),
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (data) {
      console.log("[session] user connecté chargé :", data.email);
      useAuthStore.getState().setUser(data);
    }
  }, [data]);
}
