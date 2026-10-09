import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CompanyApi } from "../api/company.api";
import { ApplicationApi } from "../api/application.api";
import { useToastStore } from "../store/toast.store";

import { Header } from "../components/Layout/Header";
import { PageContainer } from "../components/Layout/PageContainer";
import { PageTitle } from "../components/Layout/PageTitle";
import { Tabs } from "../components/Layout/Tabs";

import { RelationsSearchInput } from "../components/Network/RelationsSearchInput";
import { CompanyList } from "../components/Network/CompanyList";
import { ContactsList } from "../components/Network/ContactsList";

import { CompanyForm } from "../components/Network/CompanyForm";
import { ContactForm } from "../components/Network/ContactForm";

import type { Company } from "../types/company.types";
import type { Contact } from "../types/contact.types";
import type { CompanyFormData } from "../schemas/company.schemas";
import type { ContactFormData } from "../schemas/contact.schemas";

export function Network() {
  const [activeTab, setActiveTab] = useState<"companies" | "contacts">(
    "companies",
  );

  const queryClient = useQueryClient();

  // Les contacts restent en local : le module contact du back n'est pas encore implémenté.
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [query, setQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const { data: apiCompanies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => CompanyApi.getAll(),
  });
  // Sert à calculer le nombre de candidatures et le dernier statut par entreprise.
  const { data: myApplications = [] } = useQuery({
    queryKey: ["applications", "mine"],
    queryFn: () => ApplicationApi.getMine(),
  });

  // Conversion back (snake_case) => type Company utilisé par les composants Network.
  const companies: Company[] = apiCompanies.map((company) => {
    const applications = myApplications
      .filter((a) => a.company_id === company.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return {
      id: company.id,
      name: company.name,
      businessSector: company.business_sector,
      website: company.website,
      address: company.address,
      contactsCount: contacts.filter((c) => c.companyId === company.id).length,
      candidaturesCount: applications.length,
      latestApplicationStatus: applications[0]?.status ?? null,
    };
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data: CompanyFormData) =>
      CompanyApi.create({
        name: data.name,
        business_sector: data.businessSector,
        // champs optionnels vides non envoyés (IsUrl rejette "")
        website: data.website || undefined,
        address: data.address || undefined,
        is_public: true,
      }),
    onSuccess: (company) => {
      console.log("[réseau] entreprise créée :", company.id, company.name);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      useToastStore.getState().addToast("Entreprise ajoutée", "success");
      setShowForm(false);
    },
    onError: (error) => {
      console.error("Erreur lors de la création de l'entreprise :", error);
      const message =
        isAxiosError(error) && error.response?.status === 409
          ? "Une entreprise porte déjà ce nom"
          : "Erreur lors de la création de l'entreprise";
      useToastStore.getState().addToast(message, "error");
    },
  });

  const companyNameById = Object.fromEntries(
    companies.map((company) => [company.id, company.name]),
  );

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(query.toLowerCase()),
  );

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(query.toLowerCase()),
  );

  function deleteContact(id: number) {
    setContacts((prev) => prev.filter((contact) => contact.id !== id));
  }

  // Envoie le formulaire entreprise au back (POST company).
  function createCompany(data: CompanyFormData) {
    createCompanyMutation.mutate(data);
  }

  function submitContact(data: ContactFormData) {
    if (editingContact) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id
            ? { ...c, ...data, phone: data.phone || null }
            : c,
        ),
      );
    } else {
      const newContact: Contact = {
        id: Math.max(0, ...contacts.map((c) => c.id)) + 1,
        ...data,
        phone: data.phone || null,
      };
      setContacts((prev) => [...prev, newContact]);
    }
    setShowForm(false);
  }

  return (
    <>
      <Header />

      <PageContainer className="py-3 space-y-3">
        <PageTitle title="Relations" icon={Users} />

        <Tabs
          items={[
            { key: "companies", label: "Entreprises" },
            { key: "contacts", label: "Contacts" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          variant="onPage"
        />

        <RelationsSearchInput value={query} onChange={setQuery} />

        {activeTab === "companies" ? (
          <CompanyList companies={filteredCompanies} />
        ) : (
          <ContactsList
            contacts={filteredContacts}
            companyNameById={companyNameById}
            onEdit={(contact) => {
              setEditingContact(contact);
              setShowForm(true);
            }}
            onDelete={deleteContact}
          />
        )}

        <button
          className="btn btn-primary w-11 h-11 rounded-full p-0 mx-auto flex items-center justify-center gap-2 sm:mx-0 sm:w-full sm:h-auto sm:rounded-btn sm:p-2"
          onClick={() => {
            setEditingContact(null);
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">
            {activeTab === "companies"
              ? "Ajouter une entreprise"
              : "Ajouter un contact"}
          </span>
        </button>

        {showForm &&
          (activeTab === "companies" ? (
            <CompanyForm
              onClose={() => setShowForm(false)}
              onSubmit={createCompany}
            />
          ) : (
            <ContactForm
              initialData={editingContact}
              companies={companies}
              onClose={() => setShowForm(false)}
              onSubmit={submitContact}
            />
          ))}
      </PageContainer>
    </>
  );
}
