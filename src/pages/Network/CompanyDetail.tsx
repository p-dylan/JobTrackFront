import { Link, useParams } from "react-router";
import { Briefcase, Building2, Check, Globe, Loader2, MapPin, Plus, UserPlus, Users } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Header } from "../../components/Layout/Header";
import { PageContainer } from "../../components/Layout/PageContainer";
import { SectionCard } from "../../components/Layout/SectionCard";
import { EmptyState } from "../../components/Layout/EmptyState";
import { ContactCard } from "../../components/Network/ContactCard";

import { CompanyApi } from "../../api/company.api";
import { ConnectionApi } from "../../api/connection.api";
import { EmploymentApi } from "../../api/employment.api";
import { JobOfferingApi } from "../../api/job_offering.api";
import { useFollowCompany } from "../../hooks/useFollowCompany";
import { useConnectionActions } from "../../hooks/useConnectionActions";
import { useCurrentEmployment } from "../../hooks/useCurrentEmployment";
import { useRefreshMembership } from "../../hooks/useRefreshMembership";
import { useRole } from "../../hooks/useRole";
import { useToastStore } from "../../store/toast.store";
import { getApiErrorMessage } from "../../utils/apiError";
import { CONTRACT_TYPE_LABEL } from "../../constants/job_offering";

// Fiche entreprise : infos, suivre, demander à rejoindre, mes contacts sur place et ses offres
export function CompanyDetail() {
  const companyId = Number(useParams().id);
  const { toggleFollow, isPending: followPending } = useFollowCompany();
  const connectionActions = useConnectionActions();
  const { isCandidat } = useRole();
  const { employment, pendingRequest } = useCurrentEmployment();
  const refreshMembership = useRefreshMembership();

  const companyQuery = useQuery({
    queryKey: ["companies", "details", companyId],
    queryFn: () => CompanyApi.getDetails(companyId),
    enabled: Number.isInteger(companyId),
  });
  const offersQuery = useQuery({
    queryKey: ["job_offerings", "company", companyId, "public"],
    queryFn: () => JobOfferingApi.getAll({ companyId, take: 50 }),
    enabled: Number.isInteger(companyId),
  });
  const { data: contacts = [] } = useQuery({
    queryKey: ["connections", "contacts"],
    queryFn: () => ConnectionApi.getContacts(),
  });

  // Demande d'adhésion (PENDING) : à valider par le PDG ou un RH de l'entreprise.
  const joinMutation = useMutation({
    mutationFn: (jobTitle: string) => EmploymentApi.requestJoin(companyId, jobTitle),
    onSuccess: () => {
      console.log("[entreprise] demande d'adhésion envoyée :", companyId);
      useToastStore.getState().addToast("Demande envoyée, en attente de validation", "success");
      refreshMembership();
    },
    onError: (error) => {
      console.error("Erreur lors de la demande d'adhésion :", error);
      useToastStore
        .getState()
        .addToast(getApiErrorMessage(error, "Erreur lors de la demande d'adhésion"), "error");
    },
  });

  const company = companyQuery.data;
  if (companyQuery.isLoading || !company) {
    return (
      <>
        <Header />
        <div className="p-6 flex justify-center">
          {companyQuery.isError ? (
            <EmptyState icon={Building2} message="Entreprise introuvable." />
          ) : (
            <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
          )}
        </div>
      </>
    );
  }

  const offers = offersQuery.data?.data ?? [];
  const contactsHere = contacts.filter((c) => c.company?.id === company.id);
  const isMyCompany = employment?.company_id === company.id;
  const canJoin = isCandidat && !employment && !pendingRequest;

  function requestJoin() {
    const jobTitle = window.prompt(`Quel poste occupez-vous chez « ${company!.name} » ?`)?.trim();
    if (jobTitle) joinMutation.mutate(jobTitle);
  }

  return (
    <>
      <Header />
      <PageContainer className="py-3 space-y-3">
        <div className="bg-base-100 rounded-box p-4 border border-base-200 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {company.name}
              </h1>
              <p className="text-sm text-base-content/70">{company.business_sector}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn btn-sm ${company.is_followed ? "btn-outline" : "btn-primary"}`}
                disabled={followPending}
                onClick={() => toggleFollow(company.id, !company.is_followed)}
              >
                {company.is_followed ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {company.is_followed ? "Suivi" : "Suivre"}
              </button>
              {canJoin && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  disabled={joinMutation.isPending}
                  onClick={requestJoin}
                >
                  <UserPlus className="w-4 h-4" />
                  Demander à rejoindre
                </button>
              )}
              {isMyCompany && <span className="badge badge-primary">Votre entreprise</span>}
              {pendingRequest?.company_id === company.id && (
                <span className="badge badge-warning">Demande en attente</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/70">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {company.followers_count} abonné{company.followers_count > 1 ? "s" : ""}
            </span>
            {company.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {company.address}
              </span>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="link flex items-center gap-1">
                <Globe className="w-4 h-4" />
                Site web
              </a>
            )}
          </div>
        </div>

        <div className="-mx-4 sm:mx-0 space-y-2">
          <SectionCard title={`Offres d'emploi (${offers.length})`}>
            {offersQuery.isLoading ? (
              <div className="flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-base-content/40" />
              </div>
            ) : offers.length === 0 ? (
              <EmptyState icon={Briefcase} message="Aucune offre en ligne pour l'instant." />
            ) : (
              <ul className="divide-y divide-base-200">
                {offers.map((offer) => (
                  <li key={offer._id}>
                    <Link
                      to={`/app/offers/${offer._id}`}
                      className="flex items-center justify-between gap-3 py-2 hover:text-primary"
                    >
                      <span className="font-medium truncate">{offer.title}</span>
                      <span className="text-xs text-base-content/60 shrink-0">
                        {CONTRACT_TYPE_LABEL[offer.contractType]}
                        {offer.location ? ` · ${offer.location}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title={`Mes contacts chez ${company.name} (${contactsHere.length})`} defaultOpen={contactsHere.length > 0}>
            {contactsHere.length === 0 ? (
              <EmptyState icon={Users} message="Aucun de vos contacts ne travaille ici." />
            ) : (
              <div className="flex flex-col gap-2">
                {contactsHere.map((user) => (
                  <ContactCard
                    key={user.id}
                    user={user}
                    isPending={connectionActions.isPending}
                    onRequest={connectionActions.request}
                    onAccept={connectionActions.accept}
                    onReject={connectionActions.reject}
                    onRemove={connectionActions.remove}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </PageContainer>
    </>
  );
}
