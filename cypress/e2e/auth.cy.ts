// Session simulée : après le login stubbé, le dashboard ne doit pas tenter un
// vrai refresh (qui échouerait et renverrait vers la connexion).
beforeEach(() => {
  cy.stubSession();
});

describe("Authentification - Page d'accueil", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("affiche le formulaire de connexion par défaut", () => {
    cy.contains("button", "Se connecter").should("have.attr", "aria-pressed", "true");
    cy.get('input[type="email"]').should("be.visible");
    cy.get('input[type="password"]').should("have.length", 1);
    cy.get('form button[type="submit"]').should("contain", "Se connecter");
  });

  it("bascule entre connexion et inscription", () => {
    cy.contains("button", "S'inscrire").click();
    cy.contains("button", "S'inscrire").should("have.attr", "aria-pressed", "true");
    cy.get('input[name="last_name"]').should("be.visible");
    cy.get('input[name="first_name"]').should("be.visible");
    cy.get('input[name="confirm_password"]').should("be.visible");
    cy.get('form button[type="submit"]').should("contain", "Créer mon compte");

    cy.contains("button", "Se connecter").click();
    cy.get('input[name="last_name"]').should("not.exist");
  });

  it("donne un accès provisoire au dashboard", () => {
    cy.contains("a", "Accès provisoire au dashboard").click();
    cy.location("pathname").should("eq", "/app");
  });
});

describe("Authentification - Connexion", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("affiche les erreurs de validation si le formulaire est vide", () => {
    cy.get('form button[type="submit"]').click();

    cy.contains('[role="alert"]', "Email invalide").should("be.visible");
    cy.contains(
      '[role="alert"]',
      "Le mot de passe doit contenir au moins 8 caractères",
    ).should("be.visible");
  });

  it("refuse un email invalide et un mot de passe trop court", () => {
    cy.get('input[name="email"]').type("pas-un-email");
    cy.get('input[name="password"]').type("123");
    cy.get('form button[type="submit"]').click();

    cy.contains("Email invalide").should("be.visible");
    cy.contains("Le mot de passe doit contenir au moins 8 caractères").should("be.visible");
  });

  it("connecte l'utilisateur et redirige vers le dashboard", () => {
    cy.fixture("user").then((user) => {
      cy.intercept("POST", "**/auth/login", {
        statusCode: 200,
        body: { accessToken: "fake-access-token", user },
      }).as("login");

      cy.get('input[name="email"]').type(user.email);
      cy.get('input[name="password"]').type("password123");
      cy.get('form button[type="submit"]').click();

      cy.wait("@login")
        .its("request.body")
        .should("deep.equal", { email: user.email, password: "password123" });
      cy.location("pathname").should("eq", "/app");
    });
  });

  it("affiche un toast d'erreur si les identifiants sont refusés", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 400,
      body: { message: "Invalid credentials" },
    }).as("login");

    cy.get('input[name="email"]').type("jean.dupont@email.fr");
    cy.get('input[name="password"]').type("mauvais-mdp");
    cy.get('form button[type="submit"]').click();

    cy.wait("@login");
    cy.contains(".alert-error", "Email ou mot de passe incorrect.").should("be.visible");
    cy.location("pathname").should("eq", "/");
  });

  it("prévient l'utilisateur en cas de trop nombreuses tentatives (429)", () => {
    cy.intercept("POST", "**/auth/login", {
      statusCode: 429,
      // Requête cross-origin (API sur un autre port) : sans ce header, axios
      // ne peut pas lire "retry-after".
      headers: { "retry-after": "30", "access-control-expose-headers": "retry-after" },
      body: {},
    }).as("login");

    cy.get('input[name="email"]').type("jean.dupont@email.fr");
    cy.get('input[name="password"]').type("password123");
    cy.get('form button[type="submit"]').click();

    cy.wait("@login");
    cy.contains(".alert-warning", "Trop de tentatives. Réessayer dans 30 secondes.").should(
      "be.visible",
    );
  });

  it("ferme un toast au clic", () => {
    cy.intercept("POST", "**/auth/login", { statusCode: 400, body: {} }).as("login");

    cy.get('input[name="email"]').type("jean.dupont@email.fr");
    cy.get('input[name="password"]').type("password123");
    cy.get('form button[type="submit"]').click();
    cy.wait("@login");

    cy.contains(".alert", "Email ou mot de passe incorrect.").click();
    cy.contains(".alert", "Email ou mot de passe incorrect.").should("not.exist");
  });
});

describe("Authentification - Inscription", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains("button", "S'inscrire").click();
  });

  it("affiche les erreurs de validation si le formulaire est vide", () => {
    cy.get('form button[type="submit"]').click();

    cy.get('[role="alert"]').should("have.length.at.least", 4);
    cy.contains("Nom trop court").should("be.visible");
    cy.contains("Email invalide").should("be.visible");
    cy.contains("Le mot de passe doit contenir au moins 8 caractères").should("be.visible");
  });

  it("signale des mots de passe qui ne correspondent pas", () => {
    cy.get('input[name="last_name"]').type("Dupont");
    cy.get('input[name="first_name"]').type("Jean");
    cy.get('input[name="email"]').type("jean.dupont@email.fr");
    cy.get('input[name="password"]').type("password123");
    cy.get('input[name="confirm_password"]').type("autre-mdp-123");
    cy.get('form button[type="submit"]').click();

    cy.contains("Les mots de passe ne correspondent pas").should("be.visible");
  });

  it("crée le compte sans envoyer la confirmation du mot de passe", () => {
    cy.fixture("user").then((user) => {
      cy.intercept("POST", "**/auth/register", { statusCode: 201, body: user }).as("register");

      cy.get('input[name="last_name"]').type("Dupont");
      cy.get('input[name="first_name"]').type("Jean");
      cy.get('input[name="email"]').type(user.email);
      cy.get('input[name="password"]').type("password123");
      cy.get('input[name="confirm_password"]').type("password123");
      cy.get('form button[type="submit"]').click();

      cy.wait("@register").its("request.body").should("deep.equal", {
        last_name: "Dupont",
        first_name: "Jean",
        email: user.email,
        password: "password123",
      });
      cy.contains(".alert-success", "Inscription réussie").should("be.visible");
      cy.location("pathname").should("eq", "/app");
    });
  });

  it("affiche un toast d'erreur si l'inscription échoue", () => {
    cy.intercept("POST", "**/auth/register", { statusCode: 409, body: {} }).as("register");

    cy.get('input[name="last_name"]').type("Dupont");
    cy.get('input[name="first_name"]').type("Jean");
    cy.get('input[name="email"]').type("jean.dupont@email.fr");
    cy.get('input[name="password"]').type("password123");
    cy.get('input[name="confirm_password"]').type("password123");
    cy.get('form button[type="submit"]').click();

    cy.wait("@register");
    cy.contains(".alert-error", "Une erreur est survenue lors de l'inscription").should(
      "be.visible",
    );
    cy.location("pathname").should("eq", "/");
  });
});
