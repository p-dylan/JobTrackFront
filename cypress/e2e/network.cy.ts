// Tests sur le vrai back : les entreprises sont créées en BDD à chaque run.
// Le nom d'une entreprise est unique côté back, d'où le suffixe horodaté.
// Les contacts, eux, restent en local dans la page (module contact pas encore
// branché côté front) : ils sont créés en direct mais pas enregistrés en BDD.
// La liste contient aussi les entreprises déjà en BDD : une entreprise créée
// arrive en bas, d'où le scrollIntoView() avant de vérifier qu'elle est visible.

const uniqueName = (base: string) => `${base} ${Date.now()}`;

beforeEach(() => {
  cy.loginApi();
  cy.intercept("POST", "**/company").as("createCompany");
});

// Nettoyage BDD : on garde au moins 3 entreprises par secteur, puis on
// supprime le compte de test.
after(() => {
  cy.cleanupTestCompanies(3);
  cy.deleteTestUser();
});

describe("Relations - Ajout d'une entreprise", () => {
  beforeEach(() => {
    cy.visit("/app/network");
  });

  it("ajoute une entreprise et l'affiche dans la liste", () => {
    const acme = uniqueName("Acme Corp");
    const beta = uniqueName("Beta Inc");

    cy.contains("Ajouter une entreprise").click();

    cy.get('input[name="name"]').type(acme);
    cy.get('input[name="businessSector"]').type("Informatique");
    cy.get('input[name="website"]').type("https://acme.example.com");
    cy.get('input[name="address"]').type("1 rue de Paris");

    cy.contains("Enregistrer").click();
    cy.wait("@createCompany").its("response.statusCode").should("eq", 201);
    cy.contains("Entreprise ajoutée").should("be.visible");
    cy.contains(acme).scrollIntoView().should("be.visible");
    cy.wait(500);
    // Ajout d'une deuxième entreprise pour tester la liste
    cy.contains("Ajouter une entreprise").click();
    cy.wait(500);

    cy.get('input[name="name"]').type(beta);
    cy.get('input[name="businessSector"]').type("Marketing");
    cy.get('input[name="website"]').type("https://beta.example.com");
    cy.get('input[name="address"]').type("2 avenue de Lyon");
    cy.wait(500);
    cy.contains("Enregistrer").click();
    cy.wait("@createCompany").its("response.statusCode").should("eq", 201);
    cy.contains(beta).scrollIntoView().should("be.visible");
    cy.wait(500);
  });
});

describe("Relations - Validation du formulaire entreprise", () => {
  it("affiche les erreurs si le formulaire est vide", () => {
    cy.visit("/app/network");
    cy.contains("Ajouter une entreprise").click();
    cy.wait(500);
    cy.contains("Enregistrer").click();
    cy.wait(500);

    cy.get(".text-error").should("have.length.greaterThan", 0);
  });
});

describe("Relations - Ajout d'un contact", () => {
  // Nom partagé par le beforeEach et le test (l'entreprise est créée juste avant)
  let companyName: string;

  beforeEach(() => {
    companyName = uniqueName("Acme Corp");
    cy.visit("/app/network");

    // Une entreprise doit exister pour pouvoir l'associer au contact
    cy.contains("Ajouter une entreprise").click();
    cy.get('input[name="name"]').type(companyName);
    cy.get('input[name="businessSector"]').type("Informatique");
    cy.contains("Enregistrer").click();
    cy.wait("@createCompany").its("response.statusCode").should("eq", 201);
    cy.contains(companyName).scrollIntoView().should("be.visible");
    cy.wait(500);
    // Bascule sur l'onglet Contacts
    cy.contains("button", "Contacts").click();
  });

  it("ajoute un contact et l'affiche dans la liste", () => {
    cy.contains("Ajouter un contact").click();

    cy.get('select[name="companyId"]').select(companyName);
    cy.get('input[name="name"]').type("Jean Dupont");
    cy.get('input[name="jobTitle"]').type("Développeur");
    cy.get('input[name="email"]').type("jean.dupont@example.com");
    cy.get('input[name="phone"]').type("0601020304");

    cy.contains("Enregistrer").click();

    cy.contains("Jean Dupont").should("be.visible");
  });
});

describe("Relations - Validation du formulaire contact", () => {
  it("affiche les erreurs si le formulaire est vide", () => {
    cy.visit("/app/network");
    cy.contains("button", "Contacts").click();
    cy.contains("Ajouter un contact").click();
    cy.wait(500);
    cy.contains("Enregistrer").click();
    cy.wait(500);
    cy.get(".text-error").should("have.length.greaterThan", 0);
    cy.wait(500);
    cy.contains("Annuler").click();
  });
});
