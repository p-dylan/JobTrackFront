# Tests Cypress — rapport d'exécution

> **Résultat final (2026-11-10) : les 62 tests passent** (6 fichiers sur 6), en 2 min 50 s, en mode headless (Electron), vidéo désactivée.
> Une première exécution avait donné 56 réussites sur 62. Les 6 échecs ont été analysés (§4), corrigés (§5), puis la suite complète a été relancée (§6).

---

## 1. Ce qui bloquait Cypress jusqu'ici, et comment c'est réglé

Cypress plantait au démarrage dans l'environnement de Claude (VS Code). `npx cypress verify` affichait :

```
Cypress.exe: bad option: --smoke-test
Cypress.exe: bad option: --ping=420
```

**Cause** : la variable d'environnement `ELECTRON_RUN_AS_NODE=1`, héritée de VS Code (qui est lui-même une application Electron). Avec elle, `Cypress.exe`, qui est aussi une application Electron, se comporte comme un simple Node et refuse les options de Cypress.

**Solution** : retirer la variable pour la commande Cypress uniquement.

```powershell
# PowerShell, dans projetCrmFront
Remove-Item Env:ELECTRON_RUN_AS_NODE
npx cypress run --config video=false
```

Dans un terminal Windows classique (hors VS Code), la variable n'existe pas : `npx cypress run` suffit.

---

## 2. Conditions de l'exécution

| Prérequis | État |
|---|---|
| Front (Vite) sur `http://localhost:5173` | ✅ Lancé |
| API sur `http://localhost:3000` | ✅ Lancée, avec `allowPublicKeyRetrieval=true` (login vérifié avant de lancer les tests) |
| Docker (MySQL, Mongo, NATS) | ✅ Lancé |
| Données du seed | ✅ Base vérifiée identique au seed (3 entreprises, 18 users, 9 suivis, 8 relations, 17 emplois), seed **non relancé** |

Après chaque exécution, la base est revenue à l'état du seed : les comptes Cypress et tout ce qu'ils ont créé ont été supprimés par le `after()` de chaque fichier. Une notification du 2026-11-05 (pdg@novatech a accepté l'invitation de candidat1) est présente en base ; elle ne vient pas des tests.

---

## 3. Première exécution : 56 / 62

| Fichier | Tests | ✅ OK | ❌ Échecs |
|---|---|---|---|
| `auth.cy.ts` | 14 | 14 | 0 |
| `company.cy.ts` | 4 | 2 | **2** |
| `navigation.cy.ts` | 21 | 21 | 0 |
| `network.cy.ts` | 4 | 2 | **2** |
| `offers.cy.ts` | 7 | 7 | 0 |
| `profile.cy.ts` | 12 | 10 | **2** |
| **Total** | **62** | **56** | **6** (3 min 29 s) |

---

## 4. Analyse des échecs

**Aucune route du back n'était en erreur** : toutes les requêtes visibles dans les captures répondaient 200 ou 201, et l'interface affichait le bon état.

| # | Test | Cause | Bug de l'application ? |
|---|---|---|---|
| 4.1 | `company.cy.ts` « crée son entreprise, devient PDG puis la supprime » | `cy.contains(".badge", "PDG")` trouvait le badge du **menu latéral**, caché, au lieu de celui de la carte entreprise (test écrit par Claude) | Non |
| 4.2 | `company.cy.ts` « le candidat demande à rejoindre… » | Conséquence du 4.1 : le test s'est arrêté avant de supprimer l'entreprise, le compte est resté PDG, donc sans bouton « Demander à rejoindre » (comportement correct) | Non |
| 4.3 | `network.cy.ts` « suit une entreprise depuis la modale » | Le toast « Vous suivez… » s'affichait **sous** la modale ouverte : toast en `z-50`, modale daisyUI en `z-index: 999` | **Oui, mineur** : toasts assombris et impossibles à fermer tant qu'une modale est ouverte |
| 4.4 | `network.cy.ts` « invite un utilisateur, qui accepte… » | Même cause que le 4.3, avec le toast « Invitation envoyée » | Oui, même défaut |
| 4.5 | `profile.cy.ts` « affiche l'identité du user connecté » | `cy.get(".avatar.placeholder").contains(/^CT$/)` trouvait l'avatar du **menu latéral**, caché | Non |
| 4.6 | `profile.cy.ts` « replie et déplie une section » | Message de la section « Compétences » vérifié sans faire défiler la page : il est hors de la zone visible (fenêtre de 1280×720) | Non |

Pour 4.5 et 4.6 : probablement antérieurs à ce travail (fichier de test et section non modifiés), mais pas prouvé.

---

## 5. Corrections appliquées

| Fichier | Correction |
|---|---|
| `src/components/Overlay/Toast.tsx` | `z-50` → `z-[1000]` : les toasts passent au-dessus des modales (corrige 4.3, 4.4 et le défaut d'interface) |
| `cypress/e2e/company.cy.ts` | Badge PDG cherché dans la carte de l'entreprise : `cy.contains("h2", name).parent().contains(".badge", "PDG")` (corrige 4.1, et donc 4.2) |
| `cypress/e2e/profile.cy.ts` | Avatar hors menu latéral : `.not("aside .avatar")` (4.5) ; `scrollIntoView()` avant de vérifier le message de « Compétences » (4.6) |
| `cypress/e2e/network.cy.ts` | **Erreur révélée après les corrections** : le login de `candidat2` envoyait aussi le champ `name`, refusé par l'API (`forbidNonWhitelisted` → 400). Seuls `email` et `password` sont envoyés désormais |

---

## 6. Exécution finale : 62 / 62

| Fichier | Tests | ✅ OK | ❌ Échecs | Durée |
|---|---|---|---|---|
| `auth.cy.ts` | 14 | 14 | 0 | 0:24 |
| `company.cy.ts` | 4 | 4 | 0 | 0:18 |
| `navigation.cy.ts` | 21 | 21 | 0 | 0:33 |
| `network.cy.ts` | 4 | 4 | 0 | 0:16 |
| `offers.cy.ts` | 7 | 7 | 0 | 0:21 |
| `profile.cy.ts` | 12 | 12 | 0 | 0:56 |
| **Total** | **62** | **62** | **0** | **2:50** |

La suite complète a été relancée (et pas seulement les 3 fichiers corrigés), parce que `Toast.tsx` est partagé par toute l'application.

---

## 7. Relancer les tests

1. Démarrer Docker, `ms_job_offering`, l'API et le front (`npm run dev`).
2. Si les données ont changé, relancer le seed : `npm run seed:reset` dans `ms_job_offering`, puis `npx prisma db seed` dans `job-searchBack`. `company.cy.ts` et `network.cy.ts` en ont besoin (NovaTech, Clinique du Parc, `rh@novatech.test`, `candidat2@test.test`).
3. Dans `projetCrmFront` :
   ```powershell
   Remove-Item Env:ELECTRON_RUN_AS_NODE   # seulement dans un terminal de VS Code
   npx cypress run --config video=false
   ```
4. Les captures d'écran des tests en échec sont enregistrées dans `cypress/screenshots/<fichier>/`.
