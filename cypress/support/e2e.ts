// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Pas de session par défaut : chaque spec choisit entre cy.stubSession()
// (user simulé, sans back) et cy.loginApi() (vrai compte, vraies données).

// Pause en fin de chaque test pour avoir le temps d'observer l'écran final
// dans le runner (cypress open). Désactivée en headless (cypress run) pour ne
// pas rallonger la CI. Modifier TEST_PAUSE_MS pour changer la durée.
const TEST_PAUSE_MS = 2500;

afterEach(() => {
  if (Cypress.config("isInteractive")) {
    cy.wait(TEST_PAUSE_MS, { log: false });
  }
});