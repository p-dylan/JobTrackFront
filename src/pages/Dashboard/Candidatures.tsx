// src/pages/Dashboard/Candidatures.tsx
import { useQueries, useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp } from "lucide-react";
import { ClickableRow } from "../../components/Layout/ClickableRow";
import { EmptyState } from "../../components/Layout/EmptyState";
import { Header } from "../../components/Layout/Header";
import { PageContainer } from "../../components/Layout/PageContainer";
import { PageTitle } from "../../components/Layout/PageTitle";
import { SectionCard } from "../../components/Layout/SectionCard";
import { ApplicationApi } from "../../api/application.api";
import { JobOfferingApi } from "../../api/job_offering.api";
import { useCompanyNames } from "../../hooks/useCompanyNames";
import {
  APPLICATION_STATUS_BADGE_CLASS,
  APPLICATION_STATUS_LABEL,
} from "../../constants/job_offering";

// Liste des candidatures du user, avec le nom de l'entreprise et le titre de l'offre.
export function Candidatures() {
  const getCompanyName = useCompanyNames();

  const applicationsQuery = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: () => ApplicationApi.getMine(),
  });
  const applications = applicationsQuery.data ?? [];

  // Titre du poste : récupéré dans le ms, une requête par offre distincte.
  const offerIds = [...new Set(applications.map((a) => a.job_offering_id))];
  const offerQueries = useQueries({
    queries: offerIds.map((id) => ({
      queryKey: ["job_offerings", "detail", id],
      queryFn: () => JobOfferingApi.getOne(id),
      retry: false, // offre supprimée => erreur, libellé par défaut
    })),
  });
  // Titre de l'offre à partir de son id (ou "Offre supprimée").
  const offerTitle = (id: string) =>
    offerQueries[offerIds.indexOf(id)]?.data?.title ?? "Offre supprimée";

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <PageContainer className="pt-3 space-y-2 flex-1 flex flex-col">
        <PageTitle
          title="Candidatures"
          description="Le suivi de vos candidatures"
          icon={TrendingUp}
        />

        <div className="-mx-4 sm:mx-0">
          <SectionCard title="Candidatures" collapsible={false}>
            {applicationsQuery.isLoading ? (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
              </div>
            ) : applications.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                message="Aucune candidature en cours, lancez-vous !"
              />
            ) : (
              <div className="divide-y divide-base-200">
                {applications.map((application) => (
                  <ClickableRow
                    key={application.id}
                    to={`/app/candidatures/${application.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-base-content/90 truncate">
                        {getCompanyName(application.company_id)} — {offerTitle(application.job_offering_id)}
                      </span>
                      <span
                        className={`badge badge-sm shrink-0 ${APPLICATION_STATUS_BADGE_CLASS[application.status]}`}
                      >
                        {APPLICATION_STATUS_LABEL[application.status]}
                      </span>
                    </div>
                  </ClickableRow>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </PageContainer>
    </div>
  );
}
