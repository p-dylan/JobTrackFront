// Session simulée (fixture user) : la navigation ne dépend pas des données du back.
beforeEach(() => {
  cy.stubSession();
});

describe("Navigation - Header (desktop)", () => {
  beforeEach(() => {
    cy.visit("/app");
  });

  const mainPages = [
    { label: "Offres", path: "/app/offers", title: "Offres" },
    { label: "Réseau", path: "/app/network", title: "Relations" },
    { label: "Documents", path: "/app/documents", title: "Documents" },
    { label: "Accueil", path: "/app", title: "Accueil" },
  ];

  mainPages.forEach(({ label, path, title }) => {
    it(`navigue vers "${label}" et marque le lien comme actif`, () => {
      cy.get("header nav").contains("a", label).click();
      cy.location("pathname").should("eq", path);
      // Titres ciblés (h1/h2) : le menu latéral, caché mais monté, contient
      // aussi les libellés des pages.
      cy.contains("h1, h2", title).should("be.visible");
      cy.get("header nav").contains("a", label).should("have.class", "text-primary");
    });
  });

  it("revient à l'accueil via le logo", () => {
    cy.get("header nav").contains("a", "Offres").click();
    cy.get('a[aria-label="Retour à l\'accueil"]').click();
    cy.location("pathname").should("eq", "/app");
  });

  it("ouvre le profil via l'icône utilisateur", () => {
    cy.get('a[aria-label="Voir mon profil"]').click();
    cy.location("pathname").should("eq", "/app/profile");
  });
});

describe("Navigation - Menu latéral", () => {
  beforeEach(() => {
    cy.visit("/app");
  });

  it("s'ouvre et affiche l'utilisateur courant", () => {
    cy.sideMenu().should("have.class", "-translate-x-full");
    cy.get('button[aria-label="Ouvrir le menu"]').click();
    cy.sideMenu().should("have.class", "translate-x-0");
    // user de la fixture (cypress/fixtures/user.json)
    cy.sideMenu().should("contain", "Jean Dupont").and("contain", "jean.dupont@email.fr");
  });

  it("se ferme via le bouton de fermeture", () => {
    cy.get('button[aria-label="Ouvrir le menu"]').click();
    cy.get('button[aria-label="Fermer le menu"]').click();
    cy.sideMenu().should("have.class", "-translate-x-full");
  });

  const menuLinks = [
    { label: "Offres", path: "/app/offers" },
    { label: "Réseau", path: "/app/network" },
    { label: "Documents", path: "/app/documents" },
    { label: "Profil", path: "/app/profile" },
    { label: "Paramètres", path: "/app/settings" },
  ];

  menuLinks.forEach(({ label, path }) => {
    it(`navigue vers "${label}" et referme le menu`, () => {
      cy.navigateViaMenu(label);
      cy.location("pathname").should("eq", path);
      cy.sideMenu().should("have.class", "-translate-x-full");
    });
  });

  it("n'affiche le bouton Retour que hors des pages principales", () => {
    cy.get('button[aria-label="Ouvrir le menu"]').click();
    cy.sideMenu().contains("button", "Retour").should("not.exist");
    cy.sideMenu().contains("a", "Paramètres").click();

    cy.get('button[aria-label="Ouvrir le menu"]').click();
    cy.sideMenu().contains("button", "Retour").click();
    cy.location("pathname").should("eq", "/app");
  });

  it("bascule le thème clair/sombre et le mémorise", () => {
    cy.get("html").should("have.attr", "data-theme", "moncrm-light");
    cy.get('button[aria-label="Ouvrir le menu"]').click();

    cy.sideMenu().contains("button", "Thème clair").click();
    cy.get("html").should("have.attr", "data-theme", "moncrm-dark");
    cy.sideMenu().contains("button", "Thème sombre").should("be.visible");
    cy.window().its("localStorage.theme").should("eq", "moncrm-dark");

    cy.reload();
    cy.get("html").should("have.attr", "data-theme", "moncrm-dark");
  });
});

// Simule un glissé tactile rapide sur le document (touchstart + touchend dans
// la même frame, pour rester sous le délai max d'un "swipe"). L'événement est
// créé dans la fenêtre de l'app, pas dans celle du runner Cypress.
function swipe(fromX: number, toX: number, y = 400) {
  cy.window().then((win) => {
    const dispatch = (type: string, key: "touches" | "changedTouches", clientX: number) => {
      const event = new win.Event(type, { bubbles: true });
      Object.defineProperty(event, key, { value: [{ clientX, clientY: y }] });
      win.document.dispatchEvent(event);
    };
    dispatch("touchstart", "touches", fromX);
    dispatch("touchend", "changedTouches", toX);
  });
}

describe("Navigation - Mobile", () => {
  beforeEach(() => {
    cy.viewport(375, 812);
    cy.visit("/app");
    cy.contains("h1", "Accueil").should("be.visible");
    // Les listeners tactiles sont posés dans un useEffect de Root. data-theme
    // est posé par l'effet du ThemeProvider (parent) : React exécute les
    // effets des enfants avant ceux des parents, donc une fois l'attribut
    // présent, les listeners sont en place.
    cy.get("html").should("have.attr", "data-theme");
  });

  it("affiche la barre de navigation basse et navigue", () => {
    cy.get("header nav").should("not.be.visible");
    cy.get("nav.fixed").should("be.visible").contains("a", "Docs").click();
    cy.location("pathname").should("eq", "/app/documents");
    cy.get("nav.fixed").contains("a", "Docs").should("have.class", "text-primary");
  });

  it("ouvre la messagerie depuis la barre de navigation basse", () => {
    cy.get('nav.fixed button[aria-label="Messages, 2 messages non lus"]').click();
    cy.messagingPanel().should("have.class", "translate-x-0");
  });

  it("ouvre le menu en glissant depuis le bord gauche", () => {
    swipe(5, 200);
    cy.sideMenu().should("have.class", "translate-x-0");
  });

  it("ouvre la messagerie en glissant depuis le bord droit", () => {
    swipe(370, 150);
    cy.messagingPanel().should("have.class", "translate-x-0");
  });

  it("change de page principale en glissant depuis l'intérieur", () => {
    swipe(100, 250);
    cy.location("pathname").should("eq", "/app/offers");
    cy.contains("h1", "Offres").should("be.visible");
    swipe(250, 100);
    cy.location("pathname").should("eq", "/app");
  });
});
