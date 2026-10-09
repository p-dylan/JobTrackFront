// src/pages/Dashboard/CandidatureDetail.tsx
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, FileQuestion, Loader2 } from "lucide-react";
import { EmptyState } from "../../components/Layout/EmptyState";
import { Header } from "../../components/Layout/Header";
import { PageContainer } from "../../components/Layout/PageContainer";
import { PageTitle } from "../../components/Layout/PageTitle";
import { SectionCard } from "../../components/Layout/SectionCard";
import { ApplicationApi } from "../../api/application.api";
import { JobOfferingApi } from "../../api/job_offering.api";
import { useCompanyNames } from "../../hooks/useCompanyNames";
import { useToastStore } from "../../store/toast.store";
import {
  APPLICATION_STATUS_BADGE_CLASS,
  APPLICATION_STATUS_LABEL,
} from "../../constants/job_offering";
import { formatDate } from "../../utils/timeAgo";

// Détail d'une candidature : statut, entreprise, poste, date, et bouton pour la retirer.
export function CandidatureDetail() {
  const { id } = useParams();
  const applicationId = Number(id);
  const queryClient = useQueryClient();
  const getCompanyName = useCompanyNames();

  const applicationQuery = useQuery({
    queryKey: ["applications", "detail", applicationId],
    queryFn: () => ApplicationApi.getOne(applicationId),
    enabled: Number.isInteger(applicationId),
    retry: false,
  });
  const candidature = applicationQuery.data;

  const offerQuery = useQuery({
    queryKey: ["job_offerings", "detail", candidature?.job_offering_id],
    queryFn: () => JobOfferingApi.getOne(candidature!.job_offering_id),
    enabled: !!candidature,
    retry: false,
  });

  const withdrawMutation = useMutation({
    mutationFn: () => ApplicationApi.updateStatus(applicationId, "WITHDRAWN"),
    onSuccess: () => {
      console.log("[candidature] retirée, id :", applicationId);
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      useToastStore.getState().addToast("Candidature retirée", "success");
    },
    onError: (error) => {
      console.error("Erreur lors du retrait de la candidature :", error);
      useToastStore.getState().addToast("Erreur lors du retrait de la candidature", "error");
    },
  });

  if (applicationQuery.isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
        </div>
      </div>
    );
  }

  if (!candidature) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <PageContainer className="pt-3 space-y-2 flex-1 flex flex-col">
          <PageTitle title="Candidature introuvable" icon={TrendingUp} />
          <EmptyState
            icon={FileQuestion}
            message="Cette candidature n'existe pas ou plus."
          />
        </PageContainer>
      </div>
    );
  }

  const company = getCompanyName(candidature.company_id);
  const role = offerQuery.data?.title ?? "Offre supprimée";

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <PageContainer className="pt-3 space-y-2 flex-1 flex flex-col">
        <PageTitle
          title={`${company} — ${role}`}
          description="Détail de la candidature"
          icon={TrendingUp}
        />

        <div className="-mx-4 sm:mx-0">
          <SectionCard title="Résumé" collapsible={false}>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-base-content/60">Statut</span>
                <span
                  className={`badge badge-sm ${APPLICATION_STATUS_BADGE_CLASS[candidature.status]}`}
                >
                  {APPLICATION_STATUS_LABEL[candidature.status]}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-base-content/60">
                  Entreprise
                </span>
                <span className="text-sm text-base-content/90">
                  {company}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-base-content/60">Poste</span>
                {offerQuery.data ? (
                  <Link
                    to={`/app/offers/${candidature.job_offering_id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {role}
                  </Link>
                ) : (
                  <span className="text-sm text-base-content/90">{role}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-base-content/60">
                  Candidature envoyée le
                </span>
                <span className="text-sm text-base-content/90">
                  {formatDate(candidature.created_at)}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        <button
          type="button"
          onClick={() => {
            // TODO: brancher sur l'envoi réel d'une relance
          }}
          className="btn btn-primary w-full"
        >
          Relancer cette candidature
        </button>

        {candidature.status === "PENDING" && (
          <button
            type="button"
            onClick={() => withdrawMutation.mutate()}
            disabled={withdrawMutation.isPending}
            className="btn btn-outline btn-error w-full"
          >
            {withdrawMutation.isPending ? "Retrait..." : "Retirer ma candidature"}
          </button>
        )}
      </PageContainer>
    </div>
  );
}
