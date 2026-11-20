// Tests sur le vrai back : rôles, espace "Mon entreprise" et demandes d'adhésion.
// Le compte de test (cy.loginApi) est neuf, donc "candidat" dès l'inscription.
// Le parcours d'adhésion s'appuie sur les données du seed (npx prisma db seed) :
// l'entreprise "NovaTech Solutions" et son RH rh@novatech.test / Azerty.123.

const API_URL = "http://localhost:3000";
const SEED_COMPANY = "NovaTech Solutions";
const SEED_RH = { email: "rh@novatech.test", password: "Azerty.123" };

const uniqueName = (base: string) => `${base} ${Date.now()}`;

after(() => {
  cy.deleteTestUser();
});

describe("Rôles - Espace recruteur", () => {
  beforeEach(() => {
    cy.loginApi();
  });

  it("masque l'espace recruteur à un candidat", () => {
    cy.visit("/app/offers");
    cy.contains(/\d+ offres? trouvées?/).should("be.visible");
    cy.contains("a", "Mes offres").should("not.exist");
    cy.get('button[aria-label="Publier une offre"]').should("not.exist");
  });

  it("redirige un candidat qui ouvre /app/offers/mine", () => {
    cy.visit("/app/offers/mine");
    cy.location("pathname").should("eq", "/app");
    cy.contains("Vous n'avez pas accès à cette page").should("be.visible");
  });
});

describe("Mon entreprise - Création", () => {
  beforeEach(() => {
    cy.loginApi();
    cy.intercept("POST", "**/company/own").as("createOwn");
  });

  it("crée son entreprise, devient PDG puis la supprime", () => {
    const name = uniqueName("Cypress Corp");
    cy.visit("/app/company");
    cy.contains("Vous n'êtes membre d'aucune entreprise.").should("be.visible");

    cy.contains("button", "Créer mon entreprise").click();
    cy.contains("h3", "Créer mon entreprise").should("be.visible");
    cy.get('input[name="name"]').type(name);
    cy.get('input[name="businessSector"]').type("Informatique");
    cy.contains("Enregistrer").click();

    cy.wait("@createOwn").its("response.statusCode").should("eq", 201);
    cy.contains("Entreprise créée, vous en êtes le PDG").should("be.visible");
    cy.contains("h2", name).should("be.visible");
    // badge de la carte entreprise (le menu latéral, caché, affiche aussi un badge PDG)
    cy.contains("h2", name).parent().contains(".badge", "PDG").should("be.visible");
    cy.contains("button", "Membres (1)").should("be.visible");
    cy.contains("button", "Demandes (0)").should("be.visible");

    // le PDG a accès à l'espace recruteur
    cy.visit("/app/offers");
    cy.contains("a", "Mes offres").should("be.visible");

    // suppression (window.confirm est accepté automatiquement par Cypress)
    cy.visit("/app/company");
    cy.contains("button", "Supprimer l'entreprise").click();
    cy.contains("Entreprise supprimée").should("be.visible");
    cy.contains("Vous n'êtes membre d'aucune entreprise.").should("be.visible");
  });
});

describe("Mon entreprise - Demande d'adhésion", () => {
  it("le candidat demande à rejoindre, le RH accepte puis retire le membre", () => {
    cy.loginApi();
    // la demande se fait depuis la fiche entreprise (Relations > entreprise suivie)
    cy.request<{ id: number; name: string }[]>(`${API_URL}/company`).then(({ body }) => {
      const company = body.find((c) => c.name === SEED_COMPANY);
      expect(company, `entreprise du seed "${SEED_COMPANY}"`).not.to.equal(undefined);
      cy.visit(`/app/network/companies/${company!.id}`);
    });
    cy.window().then((win) => cy.stub(win, "prompt").returns("Développeur"));

    cy.contains("button", "Demander à rejoindre").click();
    cy.contains("Demande envoyée, en attente de validation").should("be.visible");
    // une seule demande à la fois : le bouton disparaît
    cy.contains(".badge", "Demande en attente").should("be.visible");
    cy.contains("button", "Demander à rejoindre").should("not.exist");

    cy.visit("/app/company");
    cy.contains("Demande en attente").should("be.visible");
    cy.contains(SEED_COMPANY).should("be.visible");

    // connexion du RH du seed : son cookie refresh remplace celui du candidat
    cy.request("POST", `${API_URL}/auth/login`, SEED_RH);
    cy.visit("/app/company");
    cy.contains("button", /Demandes \(\d+\)/).click();
    cy.contains("li", "Cypress Test").within(() => {
      cy.get("select").select("Recruteur");
      cy.contains("button", "Accepter").click();
    });
    cy.contains("Demande acceptée (Recruteur)").should("be.visible");

    cy.contains("button", /Membres \(\d+\)/).click();
    cy.contains("li", "Cypress Test").within(() => {
      cy.contains(".badge", "Recruteur").should("be.visible");
      cy.get('button[aria-label^="Retirer"]').click();
    });
    cy.contains("Membre retiré de l'entreprise").should("be.visible");
    cy.contains("li", "Cypress Test").should("not.exist");
  });
});

// module isolé : évite les conflits de constantes entre fichiers de spec
export {};
