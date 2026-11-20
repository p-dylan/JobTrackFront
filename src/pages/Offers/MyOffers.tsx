import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Megaphone, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Header } from "../../components/Layout/Header";
import { PageContainer } from "../../components/Layout/PageContainer";
import { PageTitle } from "../../components/Layout/PageTitle";
import { SectionCard } from "../../components/Layout/SectionCard";
import { EmptyState } from "../../components/Layout/EmptyState";
import { JobOfferingForm } from "../../components/Offers/JobOfferingForm";
import { JobOfferingApi } from "../../api/job_offering.api";
import { useCurrentEmployment } from "../../hooks/useCurrentEmployment";
import { useToastStore } from "../../store/toast.store";
import { CONTRACT_TYPE_LABEL, WORK_MODE_LABEL } from "../../constants/job_offering";
import { timeAgo } from "../../utils/timeAgo";
import type { CreateJobOfferingData, JobOffering } from "../../types/job_offering.type";

// Espace recruteur : offres publiées par l'entreprise de l'emploi actuel.
export function MyOffers() {
  const queryClient = useQueryClient();
  const { employment, isLoading: employmentLoading } = useCurrentEmployment();
  const companyId = employment?.company_id;

  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<JobOffering | null>(null);
  // Le ms ne renvoie pas les offres supprimées (soft delete) : on garde
  // celles supprimées pendant la session pour pouvoir les restaurer.
  const [deletedOffers, setDeletedOffers] = useState<JobOffering[]>([]);

  const offersQuery = useQuery({
    queryKey: ["job_offerings", "company", companyId],
    queryFn: () => JobOfferingApi.getAll({ companyId, take: 100 }),
    enabled: !!companyId,
  });
  const offers = offersQuery.data?.data ?? [];

  // Recharge toutes les listes d'offres (page Offres, Mes offres, favoris).
  const refreshOffers = () => queryClient.invalidateQueries({ queryKey: ["job_offerings"] });
  // Fabrique le onError d'une mutation : log + toast d'erreur.
  const toastError =(message: string) => (error: unknown) => {
    console.error(message, error);
    useToastStore.getState().addToast(message, "error");
  };

  const saveMutation = useMutation({
    mutationFn: (data: CreateJobOfferingData) =>
      editingOffer ? JobOfferingApi.update(editingOffer._id, data) : JobOfferingApi.create(data),
    onSuccess: (offer) => {
      console.log(`[mes offres] offre ${editingOffer ? "modifiée" : "publiée"} :`, offer._id);
      useToastStore
        .getState()
        .addToast(editingOffer ? "Offre modifiée" : "Offre publiée", "success");
      setShowForm(false);
      setEditingOffer(null);
      refreshOffers();
    },
    onError: toastError("Erreur lors de l'enregistrement de l'offre"),
  });

  const removeMutation = useMutation({
    mutationFn: (offer: JobOffering) => JobOfferingApi.remove(offer._id),
    onSuccess: (_data, offer) => {
      console.log("[mes offres] offre supprimée :", offer._id);
      setDeletedOffers((prev) => [...prev, offer]);
      useToastStore.getState().addToast("Offre supprimée", "success");
      refreshOffers();
    },
    onError: toastError("Erreur lors de la suppression de l'offre"),
  });

  const restoreMutation = useMutation({
    mutationFn: (offer: JobOffering) => JobOfferingApi.restore(offer._id),
    onSuccess: (_data, offer) => {
      console.log("[mes offres] offre restaurée :", offer._id);
      setDeletedOffers((prev) => prev.filter((o) => o._id !== offer._id));
      useToastStore.getState().addToast("Offre restaurée", "success");
      refreshOffers();
    },
    onError: toastError("Erreur lors de la restauration de l'offre"),
  });

  // Ouvre la modale : vide pour publier, pré-remplie pour modifier.
  const openForm = (offer: JobOffering | null) => {
    setEditingOffer(offer);
    setShowForm(true);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <PageContainer className="pt-3 space-y-2 flex-1 flex flex-col">
        <PageTitle
          title="Mes offres"
          description={employment ? `Offres publiées par ${employment.company.name}` : undefined}
          icon={Megaphone}
        />

        {employmentLoading || offersQuery.isLoading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
          </div>
        ) : !employment ? (
          <EmptyState
            icon={Megaphone}
            message="Vous devez être membre validé d'une entreprise pour publier des offres."
          />
        ) : (
          <div className="-mx-4 sm:mx-0 space-y-2">
            <SectionCard
              title={`${offers.length} offre${offers.length > 1 ? "s" : ""} en ligne`}
              collapsible={false}
              onAdd={() => openForm(null)}
              addLabel="Publier une offre"
            >
              {offers.length === 0 ? (
                <EmptyState icon={Megaphone} message="Aucune offre publiée pour l'instant." />
              ) : (
                <div className="divide-y divide-base-200">
                  {offers.map((offer) => (
                    <div key={offer._id} className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                      <Link to={`/app/offers/${offer._id}`} className="min-w-0 flex-1">
                        <p className="font-medium text-primary truncate hover:underline">{offer.title}</p>
                        <p className="text-xs text-base-content/60">
                          {CONTRACT_TYPE_LABEL[offer.contractType]} · {WORK_MODE_LABEL[offer.workMode]} · {timeAgo(offer.createdAt)}
                        </p>
                      </Link>
                      <button
                        type="button"
                        aria-label="Modifier l'offre"
                        className="btn btn-ghost btn-circle btn-sm"
                        onClick={() => openForm(offer)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Supprimer l'offre"
                        className="btn btn-ghost btn-circle btn-sm hover:text-error"
                        disabled={removeMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Supprimer l'offre « ${offer.title} » ? Les candidatures liées seront retirées.`)) {
                            removeMutation.mutate(offer);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {deletedOffers.length > 0 && (
              <SectionCard title="Supprimées récemment" collapsible={false}>
                <div className="divide-y divide-base-200">
                  {deletedOffers.map((offer) => (
                    <div key={offer._id} className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                      <p className="text-sm text-base-content/60 truncate">{offer.title}</p>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={restoreMutation.isPending}
                        onClick={() => restoreMutation.mutate(offer)}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restaurer
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            <div className="px-4 sm:px-0">
              <button type="button" className="btn btn-primary w-full" onClick={() => openForm(null)}>
                <Plus className="w-4 h-4" />
                Publier une offre
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <JobOfferingForm
            initialData={editingOffer}
            isSubmitting={saveMutation.isPending}
            onClose={() => {
              setShowForm(false);
              setEditingOffer(null);
            }}
            onSubmit={(data) => saveMutation.mutate(data)}
          />
        )}
      </PageContainer>
    </div>
  );
}
