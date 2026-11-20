import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { CompanyApi } from "../api/company.api";
import { ApplicationApi } from "../api/application.api";
import { ConnectionApi } from "../api/connection.api";

import { Header } from "../components/Layout/Header";
import { PageContainer } from "../components/Layout/PageContainer";
import { PageTitle } from "../components/Layout/PageTitle";
import { Tabs } from "../components/Layout/Tabs";

import { RelationsSearchInput } from "../components/Network/RelationsSearchInput";
import { CompanyList } from "../components/Network/CompanyList";
import { ContactsList } from "../components/Network/ContactsList";
import { SearchGridModal } from "../components/Network/SearchGridModal";
import { CompanyTile } from "../components/Network/CompanyTile";
import { UserTile } from "../components/Network/UserTile";

import type { Company } from "../types/company.types";

const EMPTY_PENDING = { received: [], sent: [] };

// Page Relations : entreprises suivies et contacts (mises en relation) du user connecté
export function Network() {
  const [activeTab, setActiveTab] = useState<"companies" | "contacts">(
    "companies",
  );
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { data: followedCompanies = [] } = useQuery({
    queryKey: ["companies", "followed"],
    queryFn: () => CompanyApi.getFollowed(),
  });
  const { data: contacts = [] } = useQuery({
    queryKey: ["connections", "contacts"],
    queryFn: () => ConnectionApi.getContacts(),
  });
  const { data: pending = EMPTY_PENDING } = useQuery({
    queryKey: ["connections", "pending"],
    queryFn: () => ConnectionApi.getPending(),
  });
  // Sert à calculer le nombre de candidatures et le dernier statut par entreprise.
  const { data: myApplications = [] } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: () => ApplicationApi.getMine(),
  });

  // Conversion back (snake_case) => type Company utilisé par les composants Network.
  const companies: Company[] = followedCompanies.map((company) => {
    const applications = myApplications
      .filter((a) => a.company_id === company.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return {
      id: company.id,
      name: company.name,
      businessSector: company.business_sector,
      website: company.website,
      address: company.address,
      followersCount: company.followers_count,
      contactsCount: contacts.filter((c) => c.company?.id === company.id).length,
      candidaturesCount: applications.length,
      latestApplicationStatus: applications[0]?.status ?? null,
    };
  });

  // Filtre local des listes affichées (la recherche dans l'annuaire se fait dans la modale)
  const search = query.toLowerCase();
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(search),
  );
  const filteredContacts = contacts.filter((user) =>
    [user.first_name, user.last_name, user.job_title, user.headline, user.company?.name]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(search)),
  );

  return (
    <>
      <Header />

      <PageContainer className="py-3 space-y-3">
        <PageTitle title="Relations" icon={Users} />

        <Tabs
          items={[
            { key: "companies", label: `Entreprises (${companies.length})` },
            { key: "contacts", label: `Contacts (${contacts.length})` },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          variant="onPage"
        />

        <RelationsSearchInput value={query} onChange={setQuery} />

        {activeTab === "companies" ? (
          <CompanyList companies={filteredCompanies} />
        ) : (
          <ContactsList contacts={filteredContacts} pending={pending} />
        )}

        <button
          className="btn btn-primary w-11 h-11 rounded-full p-0 mx-auto flex items-center justify-center gap-2 sm:mx-0 sm:w-full sm:h-auto sm:rounded-btn sm:p-2"
          aria-label={activeTab === "companies" ? "Suivre une entreprise" : "Ajouter un contact"}
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">
            {activeTab === "companies" ? "Suivre une entreprise" : "Ajouter un contact"}
          </span>
        </button>

        {showModal &&
          (activeTab === "companies" ? (
            <SearchGridModal
              title="Suivre une entreprise"
              searchPlaceholder="Rechercher par nom ou secteur..."
              emptyMessage="Aucune entreprise trouvée."
              queryKey="companies"
              fetchPage={CompanyApi.search}
              getKey={(company) => company.id}
              renderItem={(company) => <CompanyTile company={company} />}
              onClose={() => setShowModal(false)}
            />
          ) : (
            <SearchGridModal
              title="Ajouter un contact"
              searchPlaceholder="Rechercher par métier (ex : développeur), nom ou ville..."
              emptyMessage="Aucun utilisateur trouvé."
              queryKey="connection_users"
              fetchPage={ConnectionApi.searchUsers}
              getKey={(user) => user.id}
              renderItem={(user) => <UserTile user={user} />}
              onClose={() => setShowModal(false)}
            />
          ))}
      </PageContainer>
    </>
  );
}
