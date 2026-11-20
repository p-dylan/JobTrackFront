import { useState } from "react";
import { Link } from "react-router";
import { Building2, Clock, Inbox, Loader2, LogOut, Plus, Trash2, Users } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Header } from "../../components/Layout/Header";
import { PageContainer } from "../../components/Layout/PageContainer";
import { PageTitle } from "../../components/Layout/PageTitle";
import { SectionCard } from "../../components/Layout/SectionCard";
import { EmptyState } from "../../components/Layout/EmptyState";
import { Tabs } from "../../components/Layout/Tabs";
import { CompanyForm } from "../../components/Network/CompanyForm";
import { RoleBadge } from "../../components/Company/RoleBadge";
import { MemberRow } from "../../components/Company/MemberRow";
import { PendingRow } from "../../components/Company/PendingRow";

import { CompanyApi } from "../../api/company.api";
import { CompanyMemberApi } from "../../api/company-member.api";
import { EmploymentApi } from "../../api/employment.api";
import { useAuthStore } from "../../store/auth.store";
import { useToastStore } from "../../store/toast.store";
import { useRole } from "../../hooks/useRole";
import { useCurrentEmployment } from "../../hooks/useCurrentEmployment";
import { useRefreshMembership } from "../../hooks/useRefreshMembership";
import { getApiErrorMessage } from "../../utils/apiError";
import { ROLE, ROLE_LABELS, type RoleName } from "../../constants/roles";
import type { CompanyFormData } from "../../schemas/company.schemas";

// Fabrique le onError d'une mutation : log + toast avec le message du back.
const toastError = (fallback: string) => (error: unknown) => {
  console.error(fallback, error);
  useToastStore.getState().addToast(getApiErrorMessage(error, fallback), "error");
};

// Espace entreprise : créer la sienne, suivre sa demande d'adhésion, quitter,
// et pour PDG / RH gérer les membres et les demandes.
export function MyCompany() {
  const userId = useAuthStore((state) => state.user?.id);
  const { role, isAdmin, isPdg, canManageCompany } = useRole();
  const { employment, pendingRequest, isLoading } = useCurrentEmployment();
  const refreshMembership = useRefreshMembership();
  const companyId = employment?.company_id;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "pending">("members");

  const membersQuery = useQuery({
    queryKey: ["company_members", companyId, "members"],
    queryFn: () => CompanyMemberApi.getMembers(companyId!),
    enabled: !!companyId && canManageCompany,
  });
  const pendingQuery = useQuery({
    queryKey: ["company_members", companyId, "pending"],
    queryFn: () => CompanyMemberApi.getPending(companyId!),
    enabled: !!companyId && canManageCompany,
  });

  // Crée l'entreprise du user : il en devient le PDG.
  const createOwnMutation = useMutation({
    mutationFn: (data: CompanyFormData) =>
      CompanyApi.createOwn({
        name: data.name,
        business_sector: data.businessSector,
        website: data.website || undefined,
        address: data.address || undefined,
        is_public: true,
      }),
    onSuccess: (company) => {
      console.log("[entreprise] entreprise créée, user PDG :", company.id, company.name);
      useToastStore.getState().addToast("Entreprise créée, vous en êtes le PDG", "success");
      setShowCreateForm(false);
      refreshMembership();
    },
    onError: toastError("Erreur lors de la création de l'entreprise"),
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (id: number) => EmploymentApi.remove(id),
    onSuccess: () => {
      console.log("[entreprise] demande d'adhésion annulée");
      useToastStore.getState().addToast("Demande annulée", "success");
      refreshMembership();
    },
    onError: toastError("Erreur lors de l'annulation de la demande"),
  });

  const leaveMutation = useMutation({
    mutationFn: (id: number) => EmploymentApi.leave(id),
    onSuccess: () => {
      console.log("[entreprise] user a quitté son entreprise");
      useToastStore.getState().addToast("Vous avez quitté l'entreprise", "success");
      refreshMembership();
    },
    onError: toastError("Erreur lors du départ de l'entreprise"),
  });

  // PDG : supprime l'entreprise, tous les membres redeviennent candidats.
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: number) => CompanyApi.remove(id),
    onSuccess: () => {
      console.log("[entreprise] entreprise supprimée par le PDG");
      useToastStore.getState().addToast("Entreprise supprimée", "success");
      refreshMembership();
    },
    onError: toastError("Erreur lors de la suppression de l'entreprise"),
  });

  const acceptMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: RoleName }) =>
      CompanyMemberApi.accept(companyId!, memberId, role),
    onSuccess: (_, { role }) => {
      useToastStore.getState().addToast(`Demande acceptée (${ROLE_LABELS[role]})`, "success");
      refreshMembership();
    },
    onError: toastError("Erreur lors de l'acceptation"),
  });

  const rejectMutation = useMutation({
    mutationFn: (memberId: number) => CompanyMemberApi.reject(companyId!, memberId),
    onSuccess: () => {
      useToastStore.getState().addToast("Demande refusée", "success");
      refreshMembership();
    },
    onError: toastError("Erreur lors du refus"),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: RoleName }) =>
      CompanyMemberApi.changeRole(companyId!, memberId, role),
    onSuccess: (_, { role }) => {
      useToastStore.getState().addToast(`Rôle modifié : ${ROLE_LABELS[role]}`, "success");
      refreshMembership();
    },
    onError: toastError("Erreur lors du changement de rôle"),
  });

  const fireMutation = useMutation({
    mutationFn: (memberId: number) => CompanyMemberApi.fire(companyId!, memberId),
    onSuccess: () => {
      useToastStore.getState().addToast("Membre retiré de l'entreprise", "success");
      refreshMembership();
    },
    onError: toastError("Erreur lors du retrait du membre"),
  });

  const membersBusy =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    changeRoleMutation.isPending ||
    fireMutation.isPending;
  const members = membersQuery.data ?? [];
  const pending = pendingQuery.data ?? [];

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <PageContainer className="pt-3 space-y-3 flex-1 flex flex-col">
        <PageTitle
          title="Mon entreprise"
          description="Votre entreprise, ses membres et les demandes d'adhésion"
          icon={Building2}
        />

        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
          </div>
        ) : employment ? (
          <>
            {/* entreprise actuelle validée */}
            <div className="bg-base-100 rounded-box p-4 border border-base-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-lg">{employment.company.name}</h2>
                <RoleBadge role={role} />
              </div>
              <p className="text-sm text-base-content/70">
                {employment.job_title} · {employment.company.business_sector}
                {employment.company.address ? ` · ${employment.company.address}` : ""}
              </p>
              {isPdg ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-error"
                  disabled={deleteCompanyMutation.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Supprimer « ${employment.company.name} » ? Tous les membres redeviendront candidats.`,
                      )
                    ) {
                      deleteCompanyMutation.mutate(employment.company_id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer l'entreprise
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-error"
                  disabled={leaveMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Quitter « ${employment.company.name} » ? Vous redeviendrez candidat.`)) {
                      leaveMutation.mutate(employment.company_id);
                    }
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Quitter l'entreprise
                </button>
              )}
            </div>

            {/* gestion des membres : PDG / RH */}
            {canManageCompany && (
              <>
                <Tabs<"members" | "pending">
                  items={[
                    { key: "members", label: `Membres (${members.length})` },
                    { key: "pending", label: `Demandes (${pending.length})` },
                  ]}
                  value={activeTab}
                  onChange={setActiveTab}
                  variant="onPage"
                />

                <div className="-mx-4 sm:mx-0">
                  {activeTab === "members" ? (
                    <SectionCard title="Membres" collapsible={false}>
                      {members.length === 0 ? (
                        <EmptyState icon={Users} message="Aucun membre pour l'instant." />
                      ) : (
                        <ul className="divide-y divide-base-200">
                          {members.map((member) => (
                            <MemberRow
                              key={member.user_id}
                              member={member}
                              manageable={
                                member.user_id !== userId && member.user.role?.name !== ROLE.PDG
                              }
                              isPending={membersBusy}
                              onChangeRole={(newRole) =>
                                changeRoleMutation.mutate({ memberId: member.user_id, role: newRole })
                              }
                              onFire={() => {
                                if (
                                  window.confirm(
                                    `Retirer ${member.user.first_name} ${member.user.last_name} de l'entreprise ?`,
                                  )
                                ) {
                                  fireMutation.mutate(member.user_id);
                                }
                              }}
                            />
                          ))}
                        </ul>
                      )}
                    </SectionCard>
                  ) : (
                    <SectionCard title="Demandes d'adhésion" collapsible={false}>
                      {pending.length === 0 ? (
                        <EmptyState icon={Inbox} message="Aucune demande en attente." />
                      ) : (
                        <ul className="divide-y divide-base-200">
                          {pending.map((request) => (
                            <PendingRow
                              key={request.user_id}
                              request={request}
                              isPending={membersBusy}
                              onAccept={(newRole) =>
                                acceptMutation.mutate({ memberId: request.user_id, role: newRole })
                              }
                              onReject={() => rejectMutation.mutate(request.user_id)}
                            />
                          ))}
                        </ul>
                      )}
                    </SectionCard>
                  )}
                </div>
              </>
            )}
          </>
        ) : pendingRequest ? (
          // demande d'adhésion en attente
          <div className="bg-base-100 rounded-box p-4 border border-base-200 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              <h2 className="font-bold">Demande en attente</h2>
            </div>
            <p className="text-sm text-base-content/70">
              Votre demande pour rejoindre « {pendingRequest.company.name} » ({pendingRequest.job_title}) attend
              la validation du PDG ou d'un RH.
            </p>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              disabled={cancelRequestMutation.isPending}
              onClick={() => cancelRequestMutation.mutate(pendingRequest.company_id)}
            >
              Annuler la demande
            </button>
          </div>
        ) : isAdmin ? (
          // un admin gère la plateforme : il ne crée ni ne rejoint d'entreprise
          <div className="bg-base-100 rounded-box p-6 border border-base-200">
            <EmptyState
              icon={Building2}
              message="Un compte administrateur n'est rattaché à aucune entreprise."
            />
          </div>
        ) : (
          // aucune entreprise
          <div className="bg-base-100 rounded-box p-6 border border-base-200 flex flex-col items-center gap-3 text-center">
            <EmptyState icon={Building2} message="Vous n'êtes membre d'aucune entreprise." />
            <p className="text-sm text-base-content/60 max-w-sm">
              Créez votre entreprise pour publier des offres, ou demandez à en rejoindre une depuis{" "}
              <Link to="/app/network" className="link link-primary">
                Relations
              </Link>
              .
            </p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4" />
              Créer mon entreprise
            </button>
          </div>
        )}

        {showCreateForm && (
          <CompanyForm
            title="Créer mon entreprise"
            onClose={() => setShowCreateForm(false)}
            onSubmit={(data) => createOwnMutation.mutate(data)}
          />
        )}
      </PageContainer>
    </div>
  );
}
