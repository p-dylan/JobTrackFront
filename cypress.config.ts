import { defineConfig } from "cypress";

export default defineConfig({

  e2e: {

    baseUrl: "http://localhost:5173",

    viewportHeight: 720,
    viewportWidth: 1280,

    // Le Header et les bandeaux de la page Offres sont "sticky" : avec le
    // scroll par défaut (élément collé en haut), Cypress cliquerait sous eux.
    scrollBehavior: "center",

    // Cypress.env() est déprécié (lisible par le code du navigateur) : on le coupe.
    allowCypressEnv: false,
  },
});
