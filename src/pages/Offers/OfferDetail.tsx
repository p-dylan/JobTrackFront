import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, FileQuestion, Heart, Loader2 } from "lucide-react";
import { Header } from "../../components/Layout/Header";
import { PageContainer } from "../../components/Layout/PageContainer";
import { PageTitle } from "../../components/Layout/PageTitle";
import { SectionCard } from "../../components/Layout/SectionCard";
import { EmptyState } from "../../components/Layout/EmptyState";
import { JobOfferingApi } from "../../api/job_offering.api";
import { ApplicationApi } from "../../api/application.api";
import { useCompanyNames } from "../../hooks/useCompanyNames";
import { useFavoriteOffers } from "../../hooks/useFavoriteOffers";
import { useToastStore } from "../../store/toast.store";
import {
  APPLICATION_STATUS_BADGE_CLASS,
  APPLICATION_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
  OFFER_CATEGORY_LABEL,
  WORK_MODE_LABEL,
} from "../../constants/job_offering";
import { formatDate } from "../../utils/timeAgo";

// Ligne "libellé ... valeur" du résumé de l'offre.
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-base-content/60">{label}</span>
      <span className="text-sm text-base-content/90 text-right">{value}</span>
    </div>
  );
}

// Page détail d'une offre : infos, favori et bouton Postuler (ou statut si déjà postulé).
export function OfferDetail() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const getCompanyName = useCompanyNames();
  const { savedIds, toggleFavorite } = useFavoriteOffers();

  const offerQuery = useQuery({
    queryKey: ["job_offerings", "detail", id],
    queryFn: () => JobOfferingApi.getOne(id),
    retry: false,
  });

  // Pour savoir si le user a déjà postulé à cette offre.
  const myApplicationsQuery = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: () => ApplicationApi.getMine(),
  });
  const myApplication = myApplicationsQuery.data?.find(
    (application) => application.job_offering_id === id
  );

  const applyMutation = useMutation({
    mutationFn: () => ApplicationApi.apply(id),
    onSuccess: (application) => {
      console.log("[candidature] envoyée, id :", application.id, "offre :", id);
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      useToastStore.getState().addToast("Candidature envoyée !", "success");
    },
    onError: (error) => {
      console.error("Erreur lors de l'envoi de la candidature :", error);
      useToastStore.getState().addToast("Erreur lors de l'envoi de la candidature", "error");
    },
  });

  if (offerQuery.isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
        </div>
      </div>
    );
  }

  const offer = offerQuery.data;
  if (!offer) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <PageContainer className="pt-3 space-y-2 flex-1 flex flex-col">
          <PageTitle title="Offre introuvable" icon={Briefcase} />
          <EmptyState icon={FileQuestion} message="Cette offre n'existe pas ou plus." />
        </PageContainer>
      </div>
    );
  }

  const saved = savedIds.includes(offer._id);

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <PageContainer className="pt-3 space-y-2 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <PageTitle
            title={offer.title}
            description={getCompanyName(offer.companyId)}
            icon={Briefcase}
          />
          <button
            type="button"
            aria-label={saved ? "Retirer des favoris" : "Sauvegarder l'offre"}
            onClick={() => toggleFavorite(offer._id)}
            className={`btn btn-ghost btn-circle ${saved ? "text-primary" : "text-base-content/40 hover:text-primary"}`}
          >
            <Heart className="w-5 h-5" fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="-mx-4 sm:mx-0 space-y-2">
          <SectionCard title="Résumé" collapsible={false}>
            <div className="space-y-3">
              <InfoRow label="Contrat" value={CONTRACT_TYPE_LABEL[offer.contractType]} />
              <InfoRow label="Mode de travail" value={WORK_MODE_LABEL[offer.workMode]} />
              {offer.partTime && <InfoRow label="Temps de travail" value="Temps partiel" />}
              {offer.category && (
                <InfoRow label="Secteur" value={OFFER_CATEGORY_LABEL[offer.category]} />
              )}
              {offer.location && <InfoRow label="Lieu" value={offer.location} />}
              <InfoRow label="Publiée le" value={formatDate(offer.createdAt)} />
            </div>
          </SectionCard>

          <SectionCard title="Description" collapsible={false}>
            <p className="text-sm text-base-content/90 whitespace-pre-line">{offer.description}</p>
          </SectionCard>
        </div>

        {myApplication ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm">
            Vous avez déjà postulé
            <span className={`badge badge-sm ${APPLICATION_STATUS_BADGE_CLASS[myApplication.status]}`}>
              {APPLICATION_STATUS_LABEL[myApplication.status]}
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending || myApplicationsQuery.isLoading}
          >
            {applyMutation.isPending ? "Envoi..." : "Postuler"}
          </button>
        )}
      </PageContainer>
    </div>
  );
}
