import { useQuery } from "@tanstack/react-query";
import { EmploymentApi } from "../api/employment.api";

// Emploi actuel du user connecté : c'est lui qui donne le droit de publier
// des offres (le back déduit companyId de l'employment is_current).
export function useCurrentEmployment() {
  const { data: employments = [], isLoading } = useQuery({
    queryKey: ["employment", "mine"],
    queryFn: () => EmploymentApi.getMine(),
  });

  return {
    employment: employments.find((e) => e.is_current) ?? null,
    isLoading,
  };
}
