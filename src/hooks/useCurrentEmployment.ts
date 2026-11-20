import { useQuery } from "@tanstack/react-query";
import { EmploymentApi } from "../api/employment.api";

// Emplois du user connecté : appartenance validée (ACTIVE) et demande d'adhésion en attente (PENDING).
// Seul un emploi actuel ACTIVE rattache le user à une entreprise côté back.
export function useCurrentEmployment() {
  const { data: employments = [], isLoading } = useQuery({
    queryKey: ["employment", "mine"],
    queryFn: () => EmploymentApi.getMine(),
  });

  return {
    employment: employments.find((e) => e.is_current && e.status === "ACTIVE") ?? null,
    pendingRequest: employments.find((e) => e.is_current && e.status === "PENDING") ?? null,
    isLoading,
  };
}
