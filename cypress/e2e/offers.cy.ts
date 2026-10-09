// Tests sur le vrai back avec les offres déjà présentes en BDD. Rien n'est
// codé en dur sur leur contenu : chaque test lit la réponse du back et vérifie
// que l'affichage (et le filtre envoyé) lui correspond.
// Le compte de test est neuf (cy.loginApi) : il n'a encore aucun favori.

const categoryBadge = (label: string) => cy.get(`button[role="tab"][aria-label="${label}"]`);
// Titre de la bannière (les titres des offres sont des h3.text-primary)
const bannerTitle = (label: string) => cy.contains("h3:not(.text-primary)", label);
const searchInput = () => cy.get('input[placeholder="Rechercher une offre..."]');
const offerTitles = () => cy.get("h3.text-primary");
const resultsLabel = (total: number) =>
  `${total} ${total > 1 ? "offres trouvées" : "offre trouvée"}`;

type OfferFields = Record<string, unknown>;

// Observe une requête GET /job_offering dont l'URL contient `query`.
// L'en-tête de cache est retiré : sinon, au 2e lancement, le navigateur
// revalide son cache, le back répond 304 sans corps et le test ne peut plus
// lire les offres renvoyées (l'app, elle, reçoit sa copie en cache).
const watchOffersRequest = (query: string, alias: string) =>
  cy
    .intercept("GET", new RegExp(`/job_offering\\?.*${query}`), (req) => {
      delete req.headers["if-none-match"];
      delete req.headers["if-modified-since"];
    })
    .as(alias);

after(() => {
  cy.deleteTestUser();
});

beforeEach(() => {
  cy.loginApi();
  cy.visit("/app/offers");
  cy.contains(/\d+ offres? trouvées?/).should("be.visible");
});

describe("Offres - Filtres", () => {
  const filters = [
    { label: "À distance", query: "workMode=REMOTE", field: "workMode", value: "REMOTE", cardText: "À distance" },
    { label: "Hybride", query: "workMode=HYBRID", field: "workMode", value: "HYBRID", cardText: "Hybride" },
    { label: "Temps partiel", query: "partTime=true", field: "partTime", value: true, cardText: "Temps partiel" },
    { label: "Informatique", query: "category=INFORMATIQUE", field: "category", value: "INFORMATIQUE" },
  ];

  filters.forEach(({ label, query, field, value, cardText }) => {
    it(`filtre les offres : ${label}`, () => {
      watchOffersRequest(query, "filtered");

      categoryBadge(label).click();
      categoryBadge(label).should("have.attr", "aria-selected", "true");
      bannerTitle(label).should("be.visible");

      cy.wait("@filtered")
        .its("response.body")
        .then(({ data, total }: { data: OfferFields[]; total: number }) => {
          // le back ne renvoie que des offres qui respectent le filtre
          data.forEach((offer) => expect(offer[field]).to.eq(value));
          cy.contains(resultsLabel(total)).should("be.visible");

          if (data.length === 0) {
            cy.contains("Aucune offre dans cette catégorie pour l'instant.").should("be.visible");
          } else {
            offerTitles().should("have.length", data.length);
            if (cardText) {
              offerTitles().each(($title) =>
                cy.wrap($title).closest(".pl-1").should("contain", cardText),
              );
            }
          }
        });

      // Re-cliquer sur le badge retire le filtre
      categoryBadge(label).click();
      categoryBadge(label).should("have.attr", "aria-selected", "false");
      bannerTitle("Toutes les offres").should("be.visible");
    });
  });
});

describe("Offres - Recherche", () => {
  it("recherche une offre par mot-clé", () => {
    offerTitles()
      .first()
      .invoke("text")
      .then((rawTitle) => {
        const title = rawTitle.trim();
        // un mot du titre (lettres seules, pour un paramètre d'URL prévisible)
        const term = title.match(/[A-Za-z]{3,}/)?.[0] ?? title;
        watchOffersRequest(`search=${term}`, "search");

        searchInput().type(term);

        cy.wait("@search")
          .its("response.body")
          .then(({ data, total }: { data: OfferFields[]; total: number }) => {
            expect(total).to.be.greaterThan(0);
            cy.contains(resultsLabel(total)).should("be.visible");
            offerTitles().should("have.length", data.length);
          });
        cy.contains("h3.text-primary", title).should("be.visible");
      });
  });

  it("affiche un état vide sans résultat puis efface la recherche", () => {
    searchInput().type("zzqxwv-aucune-offre");
    cy.contains("0 offre trouvée").should("be.visible");
    cy.contains("Aucune offre dans cette catégorie pour l'instant.").should("be.visible");

    cy.get('button[aria-label="Effacer la recherche"]').click();
    searchInput().should("have.value", "");
    offerTitles().should("have.length.greaterThan", 0);
  });
});

describe("Offres - Favoris", () => {
  it("ajoute puis retire une offre des favoris", () => {
    cy.contains("button", "Sauvegardées").click();
    cy.contains("0 offre sauvegardée").should("be.visible");
    cy.contains("Aucune offre sauvegardée pour l'instant.").should("be.visible");
    cy.contains("button", "Recherche").click();

    offerTitles()
      .first()
      .invoke("text")
      .then((rawTitle) => {
        const title = rawTitle.trim();

        cy.get('button[aria-label="Sauvegarder l\'offre"]').first().click();
        cy.contains("Offre sauvegardée").should("be.visible");
        cy.get('button[aria-label="Retirer des favoris"]').should("have.length", 1);

        cy.contains("button", "Sauvegardées").click();
        cy.contains("1 offre sauvegardée").should("be.visible");
        cy.contains("h3.text-primary", title).should("be.visible");

        cy.get('button[aria-label="Retirer des favoris"]').click();
        cy.contains("Offre retirée des favoris").should("be.visible");
        cy.contains("0 offre sauvegardée").should("be.visible");
      });
  });
});
