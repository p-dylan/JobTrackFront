// Tests sur le vrai back avec un compte neuf (cy.loginApi) : profil vide au
// départ, puis rempli via les formulaires (PATCH user/profil, enregistré en
// BDD). Les describe s'exécutent dans l'ordre : la consultation voit le profil
// vide, l'édition le remplit.

type Me = { email: string };

beforeEach(() => {
  cy.loginApi().its("user").as("me");
});

after(() => {
  cy.deleteTestUser();
});

describe("Profil - Consultation", () => {
  beforeEach(() => {
    cy.visit("/app/profile");
  });

  it("affiche l'identité du user connecté", () => {
    cy.contains("h1", "Mon profil").should("be.visible");
    // h2.text-xl : le menu latéral (caché) affiche aussi le nom dans un h2
    cy.contains("h2.text-xl", "Cypress Test").should("be.visible");
    // pas de photo en BDD : avatar = initiales (ciblé sur le profil, le menu
    // latéral caché les affiche aussi)
    cy.get(".avatar.placeholder").not("aside .avatar").contains(/^CT$/).should("be.visible");
    cy.contains("Ajoutez une bio via « Modifier »").should("be.visible");
  });

  it("affiche l'email et une section compétences vide", () => {
    cy.get<Me>("@me").then(({ email }) => {
      cy.contains("span", email).scrollIntoView().should("be.visible");
    });
    cy.contains("Aucune compétence renseignée pour l'instant.")
      .scrollIntoView()
      .should("be.visible");
  });

  it("replie et déplie une section", () => {
    cy.contains('[role="button"]', "Compétences").as("skillsHeader");
    cy.get("@skillsHeader").should("have.attr", "aria-expanded", "true");

    cy.get("@skillsHeader").click();
    cy.get("@skillsHeader").should("have.attr", "aria-expanded", "false");
    cy.contains("Aucune compétence renseignée pour l'instant.").should("not.exist");

    cy.get("@skillsHeader").click();
    // la section est en bas de page : on la fait défiler avant de vérifier
    cy.contains("Aucune compétence renseignée pour l'instant.").scrollIntoView().should("be.visible");
  });

  it("affiche un aperçu local de la nouvelle photo de profil", () => {
    cy.get('img[alt="Avatar"]').should("not.exist");
    cy.get('input[type="file"]').eq(1).selectFile(
      { contents: Cypress.Buffer.from("fake-image"), fileName: "avatar.png", mimeType: "image/png" },
      { force: true },
    );
    cy.get('img[alt="Avatar"]').should("have.attr", "src").and("match", /^blob:/);
  });

  it("navigue vers les pages d'édition", () => {
    cy.contains("button", "Modifier").click();
    cy.location("pathname").should("eq", "/app/profile/edit");

    cy.visit("/app/profile");
    cy.get('button[aria-label="Ajouter un contact"]').click();
    cy.location("pathname").should("eq", "/app/profile/contact/edit");

    cy.visit("/app/profile");
    cy.get('button[aria-label="Ajouter une compétence"]').click();
    cy.location("pathname").should("eq", "/app/profile/skills/edit");
  });
});

describe("Profil - Édition", () => {
  beforeEach(() => {
    cy.intercept("PATCH", "**/user/profil").as("updateProfil");
  });

  it("pré-remplit et enregistre le profil en BDD", () => {
    cy.visit("/app/profile/edit");
    cy.contains("h1", "Modifier mon profil").should("be.visible");
    cy.contains("label", "Prénom").find("input").should("have.value", "Cypress");
    cy.contains("label", "Nom").find("input").should("have.value", "Test");
    cy.contains("label", "Titre").find("input").should("have.value", "");

    cy.contains("label", "Titre").find("input").type("Développeur Web Junior");
    cy.contains("label", "Localisation").find("input").type("Nice, France");
    cy.contains("label", "Bio").find("textarea").type("Bio écrite par Cypress");
    cy.contains("label", "Disponibilité").find("input").type("Disponible immédiatement");
    cy.contains("label", "Type de contrat").find("input").type("CDI · Freelance");
    cy.contains("label", "Salaire").find("input").type("35-45k€");
    cy.contains("button", "Enregistrer").click();

    cy.wait("@updateProfil").its("response.statusCode").should("eq", 200);
    cy.contains("Profil mis à jour").should("be.visible");
    cy.location("pathname").should("eq", "/app/profile");

    // Rechargement : les valeurs viennent bien de la BDD
    cy.visit("/app/profile");
    cy.contains("Développeur Web Junior").should("be.visible");
    cy.contains("Nice, France").should("be.visible");
    cy.contains("Bio écrite par Cypress").should("be.visible");
    cy.contains(".badge", "Disponible immédiatement").should("be.visible");
    cy.contains(".badge", "CDI · Freelance").should("be.visible");
    cy.contains(".badge", "35-45k€").should("be.visible");
  });

  it("pré-remplit et enregistre les contacts en BDD", () => {
    cy.visit("/app/profile/contact/edit");
    cy.contains("h1", "Modifier mes contacts").should("be.visible");
    cy.get<Me>("@me").then(({ email }) => {
      cy.contains("label", "Email").find("input").should("have.value", email).and("be.disabled");
    });

    cy.contains("label", "Téléphone").find("input").type("+33 6 12 34 56 78");
    cy.contains("label", "GitHub").find("input").type("github.com/cypress");
    cy.contains("button", "Enregistrer").click();

    cy.wait("@updateProfil").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/app/profile");

    cy.visit("/app/profile");
    cy.contains("span", "+33 6 12 34 56 78").scrollIntoView().should("be.visible");
    cy.contains("span", "github.com/cypress").scrollIntoView().should("be.visible");
  });

  it("revient au profil sans enregistrer", () => {
    cy.visit("/app/profile/contact/edit");
    cy.contains("button", "Retour au profil").click();
    cy.location("pathname").should("eq", "/app/profile");
  });
});

// La page d'édition des compétences n'est pas encore branchée au back
// (liste de départ codée en dur, rien n'est enregistré) : on ne teste que
// l'ajout, indépendant de cette liste.
describe("Profil - Édition des compétences", () => {
  beforeEach(() => {
    cy.visit("/app/profile/skills/edit");
  });

  it("ajoute une compétence dans 'Autres' avec le bouton", () => {
    cy.contains("Autres").should("not.exist");
    cy.get('input[placeholder="Ajouter une compétence..."]').type("Rust");
    cy.contains("button", "Ajouter").click();

    cy.contains("Autres").should("be.visible");
    cy.contains(".badge", "Rust").should("be.visible");
    cy.get('input[placeholder="Ajouter une compétence..."]').should("have.value", "");
  });

  it("ajoute une compétence avec la touche Entrée", () => {
    cy.get('input[placeholder="Ajouter une compétence..."]').type("Go{enter}");
    cy.get('input[placeholder="Ajouter une compétence..."]').type("Python{enter}");
    cy.contains("p", "Autres")
      .parent()
      .should("contain", "Go")
      .and("contain", "Python");
  });

  it("ignore une compétence vide", () => {
    cy.get('input[placeholder="Ajouter une compétence..."]').type("   ");
    cy.contains("button", "Ajouter").click();
    cy.contains("Autres").should("not.exist");
  });

  it("enregistre et revient au profil", () => {
    cy.contains("button", "Enregistrer").click();
    cy.location("pathname").should("eq", "/app/profile");
  });
});
