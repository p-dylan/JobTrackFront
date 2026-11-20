import { useRef, useState } from "react";
import { Link } from "react-router";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Heart, Inbox, Loader2, Megaphone, Plus } from "lucide-react";
import { JobOfferingForm } from "../components/Offers/JobOfferingForm";
import { useToastStore } from "../store/toast.store";
import type { CreateJobOfferingData } from "../types/job_offering.type";
import { OfferSearchBar } from "../components/Offers/OfferSearchBar";
import { OfferCategorySelector } from "../components/Offers/OfferCategorySelector";
import { OfferCategoryBanner } from "../components/Offers/OfferCategoryBanner";
import { OfferList } from "../components/Offers/OfferList";
import { EmptyState } from "../components/Layout/EmptyState";
import { Header } from "../components/Layout/Header";
import { PageContainer } from "../components/Layout/PageContainer";
import { PageTitle } from "../components/Layout/PageTitle";
import { SectionCard } from "../components/Layout/SectionCard";
import { Tabs } from "../components/Layout/Tabs";
import { offerCategories } from "../data/offerCategories";
import { JobOfferingApi } from "../api/job_offering.api";
import { OFFERS_PAGE_SIZE } from "../constants/job_offering";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useCompanyNames } from "../hooks/useCompanyNames";
import { useFavoriteOffers } from "../hooks/useFavoriteOffers";
import { useRole } from "../hooks/useRole";

function pluralize(count: number, singular: string, plural: string) {
  return count > 1 ? plural : singular;
}

// Page Offres : recherche + badges envoyés au back, "Charger plus", onglet favoris.
export function Offers() {
  // null = aucun filtre catégorie actif (toutes les offres affichées).
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "saved">("search");
  const [searchQuery, setSearchQuery] = useState("");
  // "Masquer" n'a pas d'endpoint côté back : reste local à la session.
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [alertEnabled, setAlertEnabled] = useState(false);
  const pageTopRef = useRef<HTMLDivElement>(null);

  const getCompanyName = useCompanyNames();
  const { favorites, savedIds, toggleFavorite } = useFavoriteOffers();
  // espace recruteur : réservé aux rôles recruteur / RH / PDG
  const { canRecruit } = useRole();
  const queryClient = useQueryClient();

  // Modale "Publier une offre" (recruteur uniquement).
  const [showOfferForm, setShowOfferForm] = useState(false);

  // Publie l'offre via POST job_offering : le back déduit l'entreprise de l'emploi actuel.
  const createOfferMutation = useMutation({
    mutationFn: (data: CreateJobOfferingData) => JobOfferingApi.create(data),
    onSuccess: (offer) => {
      console.log("[offres] offre publiée :", offer._id, offer.title);
      useToastStore.getState().addToast("Offre publiée", "success");
      setShowOfferForm(false);
      // recharge la liste (et "Mes offres") pour voir la nouvelle offre
      queryClient.invalidateQueries({ queryKey: ["job_offerings"] });
    },
    onError: (error) => {
      console.error("Erreur lors de la publication de l'offre :", error);
      useToastStore.getState().addToast("Erreur lors de la publication de l'offre", "error");
    },
  });

  const activeCategoryData = offerCategories.find(
    (category) => category.key === activeCategory
  );

  // La recherche part côté serveur (ms : regex sur titre / description / lieu),
  // avec un délai pour ne pas appeler l'API à chaque frappe.
  const debouncedSearch = useDebouncedValue(searchQuery.trim());
  const filters = {
    search: debouncedSearch || undefined,
    ...activeCategoryData?.filter,
  };

  const offersQuery = useInfiniteQuery({
    queryKey: ["job_offerings", "list", filters],
    queryFn: ({ pageParam }) => {
      console.log("[offres] chargement, filtres :", filters, "skip :", pageParam);
      return JobOfferingApi.getAll({ ...filters, skip: pageParam, take: OFFERS_PAGE_SIZE });
    },
    initialPageParam: 0,
    // page suivante tant que skip + take n'a pas atteint le total
    getNextPageParam: (lastPage) => {
      const nextSkip = lastPage.skip + lastPage.take;
      return nextSkip < lastPage.total ? nextSkip : undefined;
    },
  });

  // Cache une offre de la liste (en local seulement, pas d'endpoint côté back).
  const dismissOffer = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  // Sélection ET désélection (retour à "Toutes les offres") remontent en
  // haut : la search bar (qui n'est pas sticky) redevient visible et les
  // nouveaux résultats s'affichent depuis le début de la liste.
  const handleCategoryChange = (key: string | null) => {
    setActiveCategory(key);
    pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Le tri (plus récent d'abord) est fait par le ms (sort=desc sur createdAt).
  const searchedOffers = (offersQuery.data?.pages.flatMap((page) => page.data) ?? []).filter(
    (offer) => !dismissedIds.includes(offer._id)
  );
  const totalOffers = offersQuery.data?.pages[0]?.total ?? 0;

  const searchResultsLabel = offersQuery.isLoading
    ? "Chargement..."
    : `${totalOffers} ${pluralize(totalOffers, "offre trouvée", "offres trouvées")}`;
  const bannerLabel = activeCategoryData ? activeCategoryData.label : "Toutes les offres";

  return (
    <div className="flex-1 flex flex-col" ref={pageTopRef}>
      <Header />
      <PageContainer className="pt-3 flex-1 flex flex-col">
        <PageTitle
          title="Offres"
          description="Retrouvez les offres qui correspondent à votre profil"
          icon={Briefcase}
        />

        {/* Espace recruteur : seulement pour les rôles recruteur / RH / PDG,
            le back déduit l'entreprise de l'emploi actuel validé. */}
        {canRecruit && (
          <div className="space-y-2 pb-3">
            <div className="flex gap-2">
              <Link to="/app/offers/mine" className="btn btn-sm btn-primary flex-1">
                <Megaphone className="w-4 h-4" />
                Mes offres
              </Link>
              <Link to="/app/offers/received" className="btn btn-sm btn-outline flex-1">
                <Inbox className="w-4 h-4" />
                Candidatures reçues
              </Link>
            </div>
          </div>
        )}

        {showOfferForm && (
          <JobOfferingForm
            isSubmitting={createOfferMutation.isPending}
            onClose={() => setShowOfferForm(false)}
            onSubmit={(data) => createOfferMutation.mutate(data)}
          />
        )}

        <div className="flex-1 flex flex-col">
          <div className="-mx-4 sm:mx-0 flex-1 flex flex-col">
            <div className="flex flex-col divide-y divide-base-300">
              <div className="rounded-none sm:rounded-box overflow-hidden">
                <div className="bg-base-200 shadow-sm px-4 pt-2 pb-3">
                  <Tabs<"search" | "saved">
                    items={[
                      { key: "search", label: "Recherche" },
                      { key: "saved", label: "Sauvegardées" },
                    ]}
                    value={activeTab}
                    onChange={setActiveTab}
                    variant="onMuted"
                  />
                </div>
              </div>

              {activeTab === "search" && (
                // Un seul bloc englobant bannière + badges + search bar +
                // résultats : position: sticky reste "collé" tant qu'on
                // scrolle dans les limites de SON PARENT direct. Si la
                // bannière/les badges n'avaient que la search bar comme
                // parent (~90px), le sticky se décollait dès que ce petit
                // parent avait fini de défiler. En englobant aussi les
                // résultats (bien plus grands que le viewport), les deux
                // restent collés sur toute la hauteur de la liste.
                <div className="bg-base-100">
                  {/* top-16 = hauteur du Header (h-16, sticky top-0 z-30) :
                      la bannière se colle juste en dessous, jamais dessus. */}
                  <div className="sticky top-16 z-20">
                    <OfferCategoryBanner
                      label={bannerLabel}
                      resultsLabel={searchResultsLabel}
                      alertEnabled={alertEnabled}
                      onAlertToggle={setAlertEnabled}
                      showAlertToggle={!!activeCategoryData}
                    />
                  </div>
                  {/* top-30 (120px) = header (64px) + bannière (56px, cf.
                      OFFER_CATEGORY_BANNER_HEIGHT) : les badges se collent
                      juste sous la bannière. */}
                  <div className="sticky top-30 z-20 bg-base-100">
                    <OfferCategorySelector active={activeCategory} onChange={handleCategoryChange} />
                  </div>
                  {/* Sticky uniquement quand la recherche contient du texte :
                      une recherche vide n'a pas besoin de rester accessible
                      en permanence, elle scrolle avec le reste comme avant.
                      top-42 (168px) = header (64) + bannière (56) + badges
                      (48) : elle se colle juste sous les badges. */}
                  <div className={searchQuery ? "sticky top-42 z-20 bg-base-100" : ""}>
                    <OfferSearchBar value={searchQuery} onChange={setSearchQuery} />
                  </div>

                  <div className="border-t border-base-300">
                    {offersQuery.isLoading ? (
                      <div className="p-6 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
                      </div>
                    ) : offersQuery.isError ? (
                      <div className="p-4">
                        <EmptyState
                          icon={Briefcase}
                          message="Impossible de charger les offres pour le moment."
                        />
                      </div>
                    ) : searchedOffers.length === 0 ? (
                      <div className="p-4">
                        <EmptyState
                          icon={Briefcase}
                          message="Aucune offre dans cette catégorie pour l'instant."
                        />
                      </div>
                    ) : (
                      <>
                        <OfferList
                          offers={searchedOffers}
                          getCompanyName={getCompanyName}
                          savedIds={savedIds}
                          onToggleSave={toggleFavorite}
                          onDismiss={dismissOffer}
                        />
                        {offersQuery.hasNextPage && (
                          <div className="p-4 flex justify-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => offersQuery.fetchNextPage()}
                              disabled={offersQuery.isFetchingNextPage}
                            >
                              {offersQuery.isFetchingNextPage ? "Chargement..." : "Charger plus"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "saved" && (
                <SectionCard
                  title={`${favorites.length} ${pluralize(favorites.length, "offre sauvegardée", "offres sauvegardées")}`}
                  collapsible={false}
                >
                  {favorites.length === 0 ? (
                    <EmptyState
                      icon={Heart}
                      message="Aucune offre sauvegardée pour l'instant. Cliquez sur le cœur pour en ajouter !"
                    />
                  ) : (
                    <div className="-m-4">
                      <OfferList
                        offers={favorites}
                        getCompanyName={getCompanyName}
                        savedIds={savedIds}
                        onToggleSave={toggleFavorite}
                      />
                    </div>
                  )}
                </SectionCard>
              )}
            </div>

            {/* Bouton sous la liste (même style que "Ajouter une entreprise" de la
                page Relations) : il descend au fur et à mesure que les offres s'affichent.
                Rond "+" sur mobile, pleine largeur avec libellé à partir de sm. */}
            {canRecruit && (
              <div className="bg-base-100 px-4 sm:px-0 py-3">
                <button
                  type="button"
                  aria-label="Publier une offre"
                  onClick={() => setShowOfferForm(true)}
                  className="btn btn-primary w-11 h-11 rounded-full p-0 mx-auto flex items-center justify-center gap-2 sm:mx-0 sm:w-full sm:h-auto sm:rounded-btn sm:p-2"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Publier une offre</span>
                </button>
              </div>
            )}

            <div className="flex-1 bg-base-100" />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
