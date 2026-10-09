import { Link } from "react-router";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Inbox, Loader2, X } from "lucide-react";
import { Header } from "../../components/Layout/Header";
import { PageContainer } from "../../components/Layout/PageContainer";
import { PageTitle } from "../../components/Layout/PageTitle";
import { SectionCard } from "../../components/Layout/SectionCard";
import { EmptyState } from "../../components/Layout/EmptyState";
import { ApplicationApi } from "../../api/application.api";
import { JobOfferingApi } from "../../api/job_offering.api";
import { UserApi } from "../../api/user.api";
import { useToastStore } from "../../store/toast.store";
import {
  APPLICATION_STATUS_BADGE_CLASS,
  APPLICATION_STATUS_LABEL,
} from "../../constants/job_offering";
import { formatDate } from "../../utils/timeAgo";
import type { UpdatableApplicationStatus } from "../../types/application.type";

// Espace recruteur : candidatures reçues sur les offres de son entreprise.
export function ReceivedApplications() {
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery({
    queryKey: ["applications", "received"],
    queryFn: () => ApplicationApi.getReceived(),
    retry: false, // 400 si le user n'a pas d'emploi actuel
  });
  const applications = applicationsQuery.data ?? [];

  // Une application ne contient que des ids : on récupère le titre de
  // l'offre (ms) et le nom du candidat, une requête par id distinct.
  const offerIds = [...new Set(applications.map((a) => a.job_offering_id))];
  const userIds = [...new Set(applications.map((a) => a.user_id))];

  const offerQueries = useQueries({
    queries: offerIds.map((id) => ({
      queryKey: ["job_offerings", "detail", id],
      queryFn: () => JobOfferingApi.getOne(id),
      retry: false, // offre supprimée => erreur, on affiche un libellé par défaut
    })),
  });
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ["user", id],
      queryFn: () => UserApi.getOne(id),
    })),
  });

  // Titre de l'offre à partir de son id (ou "Offre supprimée").
  const offerTitle = (id: string) =>
    offerQueries[offerIds.indexOf(id)]?.data?.title ?? "Offre supprimée";
  // "Prénom Nom" du candidat à partir de son id.
  const candidateName = (id: number) => {
    const user = userQueries[userIds.indexOf(id)]?.data;
    return user ? `${user.first_name} ${user.last_name}` : `Candidat #${id}`;
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: UpdatableApplicationStatus }) =>
      ApplicationApi.updateStatus(id, status),
    onSuccess: (_data, { id, status }) => {
      console.log(`[candidatures reçues] candidature ${id} => ${status}`);
      queryClient.invalidateQueries({ queryKey: ["applications", "received"] });
      useToastStore
        .getState()
        .addToast(status === "ACCEPTED" ? "Candidature acceptée" : "Candidature refusée", "success");
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour de la candidature :", error);
      useToastStore.getState().addToast("Erreur lors de la mise à jour de la candidature", "error");
    },
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <PageContainer className="pt-3 space-y-2 flex-1 flex flex-col">
        <PageTitle
          title="Candidatures reçues"
          description="Les candidatures sur les offres de votre entreprise"
          icon={Inbox}
        />

        {applicationsQuery.isLoading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
          </div>
        ) : applicationsQuery.isError ? (
          <EmptyState
            icon={Inbox}
            message="Vous devez avoir un emploi actuel dans une entreprise pour voir les candidatures reçues."
          />
        ) : (
          <div className="-mx-4 sm:mx-0">
            <SectionCard title="Candidatures" collapsible={false}>
              {applications.length === 0 ? (
                <EmptyState icon={Inbox} message="Aucune candidature reçue pour l'instant." />
              ) : (
                <div className="divide-y divide-base-200">
                  {applications.map((application) => (
                    <div key={application.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {candidateName(application.user_id)}
                        </span>
                        <span className={`badge badge-sm shrink-0 ${APPLICATION_STATUS_BADGE_CLASS[application.status]}`}>
                          {APPLICATION_STATUS_LABEL[application.status]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-base-content/60">
                        <Link to={`/app/offers/${application.job_offering_id}`} className="truncate hover:underline">
                          {offerTitle(application.job_offering_id)}
                        </Link>
                        <span className="shrink-0">{formatDate(application.created_at)}</span>
                      </div>
                      {application.status === "PENDING" && (
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            className="btn btn-xs btn-success flex-1"
                            disabled={statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ id: application.id, status: "ACCEPTED" })}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accepter
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-error btn-outline flex-1"
                            disabled={statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ id: application.id, status: "REJECTED" })}
                          >
                            <X className="w-3.5 h-3.5" />
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
