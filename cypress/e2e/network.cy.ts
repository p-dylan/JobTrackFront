// Tests sur le vrai back : Relations = entreprises suivies + contacts (mises en relation).
// Le compte de test (cy.loginApi) est neuf : il ne suit aucune entreprise et n'a aucun contact.
// S'appuie sur les données du seed (npx prisma db seed) : 3 entreprises, des users
// avec un métier (ex : "Chargé(e) de recrutement") et le compte candidat2@test.test.

const API_URL = "http://localhost:3000";
const SEED_COMPANY = "Clinique du Parc";
const SEED_CANDIDAT = { email: "candidat2@test.test", password: "Azerty.123", name: "Chloé Dubois" };

const modal = () => cy.get('[role="dialog"]');
const tiles = () => modal().find("ul > li");

beforeEach(() => {
  cy.loginApi();
});

after(() => {
  cy.deleteTestUser();
});

describe("Relations - Entreprises", () => {
  beforeEach(() => {
    cy.visit("/app/network");
  });

  it("affiche un état vide puis suit une entreprise depuis la modale", () => {
    cy.contains("Aucune entreprise suivie.").should("be.visible");

    cy.get('button[aria-label="Suivre une entreprise"]').click();
    modal().contains("h3", "Suivre une entreprise").should("be.visible");
    tiles().should("have.length.greaterThan", 0);

    modal().find('input[type="search"]').type(SEED_COMPANY);
    tiles().should("have.length", 1);
    modal().find(`button[aria-label="Suivre ${SEED_COMPANY}"]`).click();
    cy.contains(`Vous suivez ${SEED_COMPANY}`).should("be.visible");
    modal().contains("button", "Suivi").should("be.visible");

    modal().find('button[aria-label="Fermer"]').click();
    cy.contains("button", "Entreprises (1)").should("be.visible");
    cy.contains("a", SEED_COMPANY).should("be.visible");
  });

  it("ouvre la fiche entreprise et ne la suit plus", () => {
    cy.contains("a", SEED_COMPANY).click();
    cy.location("pathname").should("match", /\/app\/network\/companies\/\d+$/);
    cy.contains("h1", SEED_COMPANY).should("be.visible");
    cy.contains(/Offres d'emploi \(\d+\)/).should("be.visible");

    cy.contains("button", "Suivi").click();
    cy.contains(`Vous ne suivez plus ${SEED_COMPANY}`).should("be.visible");
    cy.contains("button", "Suivre").should("be.visible");

    cy.visit("/app/network");
    cy.contains("Aucune entreprise suivie.").should("be.visible");
  });
});

describe("Relations - Contacts", () => {
  beforeEach(() => {
    cy.visit("/app/network");
    cy.contains("button", "Contacts").click();
  });

  it("affiche l'annuaire en grille, charge plus et filtre par métier", () => {
    cy.get('button[aria-label="Ajouter un contact"]').click();
    modal().contains("h3", "Ajouter un contact").should("be.visible");
    // 9 vignettes par page sur desktop (3 x 3)
    tiles().should("have.length", 9);
    modal().contains("button", "Charger plus").click();
    tiles().should("have.length.greaterThan", 9);

    modal().find('input[type="search"]').type("recrutement");
    tiles().should("have.length", 3);
    tiles().each(($tile) => cy.wrap($tile).should("contain", "Chargé(e) de recrutement"));
  });

  it("invite un utilisateur, qui accepte : il apparaît dans les contacts", () => {
    cy.get('button[aria-label="Ajouter un contact"]').click();
    modal().find('input[type="search"]').type(SEED_CANDIDAT.name.split(" ")[1]);
    modal().find(`button[aria-label="Se connecter avec ${SEED_CANDIDAT.name}"]`).click();
    cy.contains("Invitation envoyée").should("be.visible");
    modal().contains("En attente").should("be.visible");
    modal().find('button[aria-label="Fermer"]').click();
    cy.contains("Invitations envoyées (1)").should("be.visible");

    // candidat2 accepte via l'API (son propre token)
    cy.loginApi().then(({ user }) => {
      // email + mot de passe seulement : l'API refuse les champs inconnus (forbidNonWhitelisted)
      const { email, password } = SEED_CANDIDAT;
      cy.request("POST", `${API_URL}/auth/login`, { email, password }).then(({ body }) => {
        cy.request({
          method: "PATCH",
          url: `${API_URL}/connection/${user.id}/accept`,
          headers: { Authorization: `Bearer ${body.accessToken}` },
        });
      });
    });

    // reconnexion du compte de test (le login de candidat2 a remplacé le cookie refresh)
    cy.loginApi();
    cy.visit("/app/network");
    cy.contains("button", "Contacts (1)").click();
    cy.contains(SEED_CANDIDAT.name).should("be.visible");

    // retrait du contact (window.confirm accepté automatiquement)
    cy.get(`button[aria-label="Retirer ${SEED_CANDIDAT.name} de vos contacts"]`).click();
    cy.contains("Relation retirée").should("be.visible");
    cy.contains("Aucun contact.").should("be.visible");
  });
});

// module isolé : évite les conflits de constantes entre fichiers de spec
export {};
