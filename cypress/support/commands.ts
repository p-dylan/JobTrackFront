/// <reference types="cypress" />

// Le token et l'utilisateur ne vivent qu'en mémoire (store zustand) : chaque
// cy.visit() recharge la page et Root restaure la session via
// POST /auth/refresh (cookie refreshToken). Deux façons d'arriver connecté :
// - cy.stubSession() : refresh stubbé avec la fixture user, sans back ;
// - cy.loginApi()    : vrai compte sur le back, le cookie refresh est posé par
//   cy.request et le refresh au chargement de la page est donc réel.

// Même URL que VITE_API_URL (.env).
const API_URL = "http://localhost:3000";
const TEST_PASSWORD = "Cypress123!";

// Un compte neuf par fichier de spec (le support est rechargé à chaque spec) :
// aucun favori ni donnée héritée d'un run précédent. Supprimé en fin de spec
// par cy.deleteTestUser().
let testUserEmail: string | null = null;

type TestUser = { id: number; email: string; first_name: string; last_name: string };
type LoginBody = { accessToken: string; user: TestUser };
type ApiCompany = { id: number; business_sector: string; created_by_user_id: number };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Stubbe /auth/refresh et /user/profil avec la fixture user (session simulée). */
      stubSession(): Chainable<void>;
      /** Crée (une fois par spec) un vrai compte puis s'y connecte via l'API. */
      loginApi(): Chainable<LoginBody>;
      /** Supprime (soft delete) les entreprises créées par le compte de test, en en gardant au moins `minPerSector` par secteur. */
      cleanupTestCompanies(minPerSector?: number): Chainable<void>;
      /** Supprime le compte de test de la BDD. */
      deleteTestUser(): Chainable<void>;
      /** Ouvre le menu latéral et clique sur le lien donné. */
      navigateViaMenu(label: string): Chainable<void>;
      /** Retourne le panneau de messagerie (aside de droite). */
      messagingPanel(): Chainable<JQuery<HTMLElement>>;
      /** Retourne le menu latéral (aside de gauche). */
      sideMenu(): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add("stubSession", () => {
  cy.fixture("user").then((user) => {
    cy.intercept("POST", "**/auth/refresh", {
      statusCode: 200,
      body: { accessToken: "fake-access-token", user },
    }).as("refresh");
    cy.intercept("GET", "**/user/profil", { statusCode: 200, body: user }).as("profil");
  });
});

Cypress.Commands.add("loginApi", () => {
  if (!testUserEmail) {
    const email = `cypress.${Date.now()}@test.fr`;
    cy.request("POST", `${API_URL}/auth/register`, {
      first_name: "Cypress",
      last_name: "Test",
      email,
      password: TEST_PASSWORD,
    }).then(() => {
      testUserEmail = email;
    });
  }

  // Le back répond avec le cookie refreshToken : le navigateur le renverra au
  // POST /auth/refresh fait par Root au prochain cy.visit().
  return cy
    .then(() =>
      cy.request<LoginBody>("POST", `${API_URL}/auth/login`, {
        email: testUserEmail,
        password: TEST_PASSWORD,
      }),
    )
    .its("body");
});

Cypress.Commands.add("cleanupTestCompanies", (minPerSector = 3) => {
  if (!testUserEmail) return;

  cy.loginApi().then(({ accessToken, user }) => {
    cy.request<ApiCompany[]>(`${API_URL}/company`).then(({ body: companies }) => {
      const countBySector: Record<string, number> = {};
      companies.forEach((company) => {
        countBySector[company.business_sector] = (countBySector[company.business_sector] ?? 0) + 1;
      });

      // Seules les entreprises du compte de test sont supprimées, les plus
      // récentes d'abord, tant que le secteur en garde plus que minPerSector.
      companies
        .filter((company) => company.created_by_user_id === user.id)
        .sort((a, b) => b.id - a.id)
        .forEach((company) => {
          if (countBySector[company.business_sector] <= minPerSector) return;
          countBySector[company.business_sector] -= 1;
          cy.request({
            method: "DELETE",
            url: `${API_URL}/company/${company.id}`,
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        });
    });
  });
});

Cypress.Commands.add("deleteTestUser", () => {
  if (!testUserEmail) return;

  cy.loginApi().then(({ accessToken }) => {
    cy.request({
      method: "DELETE",
      url: `${API_URL}/user/account`,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });
  cy.then(() => {
    testUserEmail = null;
  });
});

Cypress.Commands.add("sideMenu", () => cy.get("aside.left-0"));

Cypress.Commands.add("messagingPanel", () => cy.get("aside.right-0"));

Cypress.Commands.add("navigateViaMenu", (label: string) => {
  cy.get('button[aria-label="Ouvrir le menu"]').click();
  cy.sideMenu().should("have.class", "translate-x-0");
  cy.sideMenu().contains("a", label).click();
});

export {};
