describe("Relations - Ajout d'une entreprise", () => {
  beforeEach(() => {
    cy.visit("/app/network");
  });

  it("ajoute une entreprise et l'affiche dans la liste", () => {
    cy.contains("Ajouter une entreprise").click();

    cy.get('input[name="name"]').type("Acme Corp");
    cy.get('input[name="businessSector"]').type("Informatique");
    cy.get('input[name="website"]').type("https://acme.example.com");
    cy.get('input[name="address"]').type("1 rue de Paris");

    cy.contains("Enregistrer").click();
    cy.wait(500);
    cy.contains("Acme Corp").should("be.visible");
// Ajout d'une deuxième entreprise pour tester la liste
    cy.contains("Ajouter une entreprise").click();
    cy.wait(500);

    cy.get('input[name="name"]').type("Beta Inc");
    cy.get('input[name="businessSector"]').type("Marketing");
    cy.get('input[name="website"]').type("https://beta.example.com");
    cy.get('input[name="address"]').type("2 avenue de Lyon");
    cy.wait(500);
    cy.contains("Enregistrer").click();
    cy.wait(500);
    cy.contains("Beta Inc").should("be.visible");
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
  beforeEach(() => {
    cy.visit("/app/network");
    

    // Une entreprise doit exister pour pouvoir l'associer au contact
    cy.contains("Ajouter une entreprise").click();
    cy.get('input[name="name"]').type("Acme Corp");
    cy.get('input[name="businessSector"]').type("Informatique");
    cy.contains("Enregistrer").click();
    cy.wait(500);
    cy.contains("Acme Corp").should("be.visible");
    cy.wait(500);
    // Bascule sur l'onglet Contacts
    cy.contains("Contacts").click();
  });

  it("ajoute un contact et l'affiche dans la liste", () => {
    cy.contains("Ajouter un contact").click();

    cy.get('select[name="companyId"]').select("Acme Corp");
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
    cy.contains("Contacts").click();
    cy.contains("Ajouter un contact").click();
    cy.wait(500);
    cy.contains("Enregistrer").click();
    cy.wait(500);
    cy.get(".text-error").should("have.length.greaterThan", 0);
    cy.wait(500);
    cy.contains("Annuler").click();
  });
});