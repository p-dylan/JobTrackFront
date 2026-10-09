import { useQuery } from "@tanstack/react-query";
import { CompanyApi } from "../api/company.api";

// Les offres du ms ne contiennent que companyId : on récupère la liste des
// entreprises une fois (partagée via le cache react-query sous ["companies"])
// pour afficher leur nom.
export function useCompanyNames() {
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => CompanyApi.getAll(),
  });

  const companyNameById: Record<number, string> = Object.fromEntries(
    companies.map((company) => [company.id, company.name]),
  );

  return (companyId: number) => companyNameById[companyId] ?? "Entreprise";
}
