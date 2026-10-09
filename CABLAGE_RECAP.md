# Récapitulatif — Front Offres & câblage API

_Date : 23/09/2026 — branches : `develop` (front, back), ms non versionné_

## Architecture des appels

```
projetCrmFront (React)
   │  axios (utils/axios-client.ts) + TanStack Query
   ▼
job-searchBack (NestJS, gateway HTTP :3000)
   │  /job_offering/*  ──NATS──►  ms_job_offering (NestJS + MongoDB)
   │  /application, /company, /employment, /auth, /user  ──►  MySQL (Prisma)
```

Pattern de câblage conservé (identique à `user.api.ts` / `Settings.tsx`) :

1. une classe statique `XxxApi` dans `src/api/xxx.api.ts` qui appelle `api` et renvoie `data` ;
2. les types calqués sur la réponse du back dans `src/types/xxx.type.ts` ;
3. dans les pages : `useQuery` / `useMutation`, avec les toasts `useToastStore` en `onSuccess` / `onError`.

---

## 1. Correctif important

**`src/utils/axios-client.ts`** : l'intercepteur de réponse (succès) ne faisait pas `return res`, donc **tous les appels API renvoyaient `undefined`**. Ajout du `return res`.
Suppression aussi de deux imports inutilisés ajoutés par erreur (`ca` depuis `zod/v4/locales`, `data` depuis `react-router`).

---

## 2. Microservice `ms_job_offering`

Nouveaux champs sur l'offre (tous avec une valeur par défaut, donc les offres existantes restent valides) :

| Champ | Type | Défaut | Rôle côté front |
|---|---|---|---|
| `workMode` | `ON_SITE` \| `REMOTE` \| `HYBRID` | `ON_SITE` | badges « À distance » / « Hybride » |
| `partTime` | boolean | `false` | badge « Temps partiel » |
| `category` | `INFORMATIQUE`, `ENSEIGNEMENT`, `HOTELLERIE`, `ADMINISTRATION`, `COMMERCE`, `TRANSPORT`, `SANTE`, `INDUSTRIE`, `MARKETING`, `FINANCE` | `null` | badges secteur |
| `location` | string | `null` | lieu affiché sur la carte |

Fichiers modifiés :
- `src/offers/schema/offers.schema.ts` : enums `WorkMode`, `OfferCategory`, nouveaux `@Prop`, index `category` et `workMode`
- `src/offers/dto/create-offer.dto.ts` : champs optionnels
- `src/offers/dto/find-all-offers.dto.ts` : filtres `category`, `workMode`, `partTime`
- `src/offers/offers.service.ts` : filtres ajoutés à la requête Mongo ; la recherche texte porte aussi sur `location`

## 3. Gateway `job-searchBack`

- `src/job_offering/dto/create-job_offering.dto.ts` : mêmes enums et champs optionnels (indispensable à cause de `forbidNonWhitelisted`). `title` limité à 150 caractères, comme dans le ms.
- `src/job_offering/dto/find-all-job_offering.dto.ts` : filtres `category`, `workMode` et `partTime` (converti depuis `"true"` comme `favoritesOnly`). Les enums sont importés depuis le DTO de création au lieu d'être dupliqués.

---

## 4. Front — Offres

### Endpoints branchés (`src/api/job_offering.api.ts`)

| Méthode | Endpoint | Utilisé dans |
|---|---|---|
| `getAll(params)` | `GET job_offering?skip&take&search&category&workMode&partTime&companyId&favoritesOnly` | Offres, Mes offres, favoris |
| `getOne(id)` | `GET job_offering/:id` | Détail offre, candidatures |
| `create` | `POST job_offering` | Mes offres |
| `update` | `PATCH job_offering/:id` | Mes offres |
| `remove` | `DELETE job_offering/:id` | Mes offres |
| `restore` | `PATCH job_offering/:id/restore` | Mes offres |
| `addFavorite` / `removeFavorite` | `POST` / `DELETE job_offering/:id/favorite` | cœur (liste et détail) |

### Pages et composants

| Route | Fichier | Contenu |
|---|---|---|
| `/app/offers` | `pages/Offers.tsx` | Recherche **côté serveur** (avec délai de 300 ms), badges → vrais filtres, « Charger plus » (`useInfiniteQuery`, 5 par page pour garder « Publier une offre » visible), onglet Sauvegardées = favoris API. Liens recruteur visibles si emploi actuel. |
| `/app/offers/:id` | `pages/Offers/OfferDetail.tsx` | Détail + cœur + **Postuler** (`POST application`) ; affiche le statut si déjà postulé |
| `/app/offers/mine` | `pages/Offers/MyOffers.tsx` | Recruteur : liste des offres de l'entreprise, publier, modifier, supprimer, restaurer |
| `/app/offers/received` | `pages/Offers/ReceivedApplications.tsx` | Recruteur : candidatures reçues, **Accepter / Refuser** |

- `components/Offers/OfferCard.tsx` et `OfferList.tsx` : adaptés au type `JobOffering` (titre cliquable vers le détail, « Entreprise · Contrat », lieu masqué s'il est vide, « il y a Xh » calculé depuis `createdAt`)
- `components/Offers/JobOfferingForm.tsx` + `schemas/job_offering.schemas.ts` : modale react-hook-form + zod
- `data/offerCategories.ts` : chaque badge porte son `filter` API ; suppression des données mockées
- `routes.tsx` : `offers` devient un groupe (`index`, `mine`, `received`, `:id`)

### Hooks partagés (`src/hooks/`)

- `useCompanyNames` : le ms ne renvoie que `companyId` ; récupère `GET company` une fois (cache `["companies"]`) pour afficher le nom
- `useFavoriteOffers` : favoris et toggle du cœur, partagés entre la liste et le détail
- `useCurrentEmployment` : `GET employment`, sert à savoir si le user peut publier
- `useDebouncedValue` : délai sur la recherche

---

## 5. Front — autres câblages

| Fonctionnalité | Fichier | Endpoint |
|---|---|---|
| Changer le mot de passe | `pages/Settings/SettingsPassword.tsx` | `PATCH auth/password` (`AuthApi.changePassword`, sans `confirmPassword`) |
| Liste des candidatures | `pages/Dashboard/Candidatures.tsx` | `GET application/candidate` + titre via `GET job_offering/:id` |
| Détail candidature | `pages/Dashboard/CandidatureDetail.tsx` | `GET application/:id`, **Retirer** via `PATCH application/:id/status` (`WITHDRAWN`) |
| Réseau → Entreprises | `pages/Network.tsx` | `GET company`, `POST company` (camelCase → snake_case, `is_public: true`) ; nombre de candidatures et dernier statut calculés depuis `GET application/candidate` |

Nouveaux fichiers API et types : `application.api.ts`, `company.api.ts`, `employment.api.ts`, `UserApi.getOne`, `AuthApi.changePassword`, `types/application.type.ts`, `types/employment.type.ts`, `ApiCompany` / `CreateCompanyData` dans `company.types.ts`, `ChangePasswordData` dans `auth.type.ts`.

---

## 6. Non câblé (back pas prêt ou front absent)

| Domaine | Raison |
|---|---|
| Contacts (Réseau) | `contact.service.ts` renvoie encore « This action… » → reste en state local |
| Documents, Entretiens, Messagerie, Publications, Compétences, Connexions, Commentaires | services back non implémentés (stubs) |
| ~~Profil~~ | ✅ câblé depuis (migration + `PATCH user/profil`), voir section 9. Seules les compétences restent vides. |
| Notifications | ✅ affichées dans « Derniers événements » de l'accueil (section 9) ; pas encore de page ni de cloche dédiée |
| Alerte sur catégorie / « Masquer » une offre / Relancer | pas d'endpoint → restent locaux ou TODO |

## 7. Points d'attention / à faire

- **Erreurs du ms** : les `RpcException` (ex. « Offer already in favorites », « not authorized ») remontent en **500** côté gateway, faute de filtre RPC → HTTP. Le front affiche donc un message générique. À prévoir : un filtre d'exception dans le gateway.
- **Sécurité** : `GET application/:id` ne vérifie pas que la candidature appartient au user (ou à son entreprise).
- **Sécurité** : `search` est injecté tel quel dans un `$regex` Mongo (regex non échappée) ; il faudrait l'échapper côté ms.
- Les offres supprimées ne sont pas listées par le ms (`deletedAt: null`) : la restauration n'est possible que pendant la session (« Supprimées récemment »). Pour une vraie corbeille, il faudrait un filtre `deleted=true` côté ms.
- Les favoris sont chargés avec `take: 100` (le ms pagine toujours).
- ~~`cypress/e2e/offers.cy.ts` se base sur `mockOffers.json`~~ → ✅ réécrit sur les vraies offres de la BDD, voir section 12.
- Fichiers de mock désormais inutilisés : `src/data/mockOffers.json`, `src/data/candidatures.ts`, `src/data/currentUser.ts`, `src/data/dashboard.ts` (voir section 9).
- Erreur TypeScript préexistante, sans lien avec ces changements : `components/Auth/RecoveryPasswordForm.tsx` importe `../../Auth/AuthSchemas`, qui n'existe pas (bloque `npm run build`, pas `vite`).

## 8. Tester rapidement

1. `docker compose up -d` à la racine de `projetCRM` (MySQL, Mongo et NATS sur `localhost:4222`)
2. `ms_job_offering` : `npm run start:dev`
3. `job-searchBack` : `npm run start:dev`
4. `projetCrmFront` : `npm run dev`
5. Recruteur : créer une entreprise (Réseau), créer un `employment` `is_current` (API `POST employment`), puis Offres → **Mes offres** → Publier
6. Candidat : Offres → filtrer ou chercher → détail → **Postuler** → Dashboard → Candidatures

---

# 9. Accueil, Profil et Menu : données réelles

## Session restaurée au rechargement

- **`hooks/useSyncCurrentUser.ts`** (appelé dans `pages/Root.tsx`) : `GET user/profil` puis `setUser` dans `useAuthStore`. Au rechargement, le token en mémoire est perdu : l'appel reçoit un 401, l'intercepteur fait le refresh, rejoue la requête et le store est rempli.
- **`utils/axios-client.ts`** : les requêtes qui reçoivent un 401 en même temps **partagent un seul refresh** (`refreshPromise`). Avant, chaque requête lançait son propre refresh ; comme le back fait tourner le refresh token, le 2e échouait (« Tokens don't match ») et renvoyait vers `/login`. C'était visible dès qu'une page lance plusieurs requêtes (l'accueil en lance 4).

## Back `job-searchBack`

- **Migration `20260923190120_user_profile_fields`** : colonnes optionnelles sur `User` → `headline`, `location`, `bio`, `availability`, `job_type`, `salary`, `phone`, `website`, `linkedin`, `github` (uniquement des `ADD COLUMN ... NULL`).
- **`PATCH user/profil`** + `dto/update-profil.dto.ts` : modifie **uniquement le user connecté**, champs limités (prénom, nom et infos de profil ; ni email, ni mot de passe, ni rôle). Envoyer `null` efface un champ.
- **Sécurité corrigée** : `GET user/profil` et `GET user/:id` renvoyaient le **hash du mot de passe et le refresh token**. Ils passent maintenant par `toSafeUser`.

## Front

| Écran | Avant | Maintenant |
|---|---|---|
| Menu latéral (`components/SideMenu`) | `currentUser` mocké | nom, email et initiales du user connecté (`useAuthStore`) |
| Accueil : bandeau | mock | prénom et initiales réels |
| Accueil : « Candidatures actives » | 12 | candidatures `PENDING` + `ACCEPTED` (`GET application/candidate`) |
| Accueil : « Offres disponibles » | 1 | `total` de `GET job_offering` |
| Accueil : « Entretiens prévus » | 3 | 0 (module entretien non implémenté côté back) |
| Accueil : « Prochaines actions » | mock | état vide (pas de back relances ni entretiens) |
| Accueil : « Derniers événements » | mock | **notifications réelles** (`GET notifications`), libellés et icônes dans `constants/notification.ts` |
| Profil : identité | mock + photo picsum | nom, titre (`headline`, sinon poste et entreprise de l'emploi actuel), lieu, bio, badges ; avatar = initiales. Champs vides masqués. |
| Profil : contact | mock | email, téléphone, site, LinkedIn, GitHub (lignes vides masquées) |
| Profil : compétences | mock | état vide (module skill non implémenté côté back) |
| `ProfileEdit` | TODO | `PATCH user/profil` (toast, store mis à jour, retour au profil) |
| `ProfileContactEdit` | TODO | `PATCH user/profil` ; **email en lecture seule** (identifiant de connexion) |

Nouveaux fichiers : `hooks/useSyncCurrentUser.ts`, `hooks/useUpdateProfil.ts` (mutation partagée + `emptyToNull`), `utils/userDisplay.ts` (`getInitials`, `getFullName`), `constants/notification.ts`, `UserApi.getProfil` / `UserApi.updateProfil`, type `UpdateProfilData`. Le type `User` contient les nouveaux champs.

## Points d'attention

- **`PUT user/:id`** existe toujours et permet de modifier **n'importe quel user** (mot de passe compris) sans vérification. Le front ne l'utilise pas ; il faudrait la supprimer ou la réserver aux admins.
- ~~**Déconnexion** : `POST auth/logout` n'existait pas~~ → ✅ fait, voir section 10.
- Photo de profil et bannière : aperçu local seulement (pas d'upload côté back).
- « Derniers événements » : l'état « vu » reste en `localStorage` comme avant ; `PATCH notifications/:id/read` existe côté back si on veut s'en servir.

---

# 10. Déconnexion

## Back `job-searchBack`

- **`POST auth/logout`** (`src/auth/auth.controller.ts`) : protégée par `AuthGuard`, répond `204`.
  - Le cookie `refreshToken` a `path: '/auth/refresh'`, donc le navigateur ne l'envoie **pas** à `/auth/logout` : le user est identifié par l'access token. S'il est expiré, l'intercepteur fait le refresh puis rejoue la déconnexion.
  - Met `refreshToken` à `null` en BDD : un cookie copié ne peut plus servir (« Tokens don't match » au refresh).
  - Supprime le cookie via **`clearTokenCookie`** (`src/auth/auth.service.ts`), avec le même `path` et `sameSite` que `insertTokenCookie` (sinon le navigateur ne le supprime pas).

## Front

- **`components/SideMenu/index.tsx`** : « Déconnexion » est maintenant un bouton (même style rouge) qui lance `AuthApi.logout()` (déjà existant) via `useMutation`.
  - Succès → toast **« Vous avez bien été déconnecté »** (`useToastStore`).
  - Échec réseau → toast warning, mais on déconnecte quand même côté front.
  - Dans tous les cas : `clearAuth()` (store), fermeture du menu, `navigate("/")`, puis `queryClient.clear()` pour ne pas garder les données du compte précédent.
- **Redirections vers `/login` corrigées** : la route n'existe pas (la connexion est sur `/`).
  - `utils/axios-client.ts` : refresh échoué → `window.location.href = "/"`
  - `pages/Settings/Settings.tsx` : suppression du compte → `navigate("/")`

## Points d'attention

- Les pages `/app/*` ne sont pas protégées par une garde de route : après déconnexion, taper `/app` à la main affiche la page, puis la 1re requête API (401 → refresh échoué) renvoie vers `/`. Une garde dans `Root.tsx` rendrait ça immédiat.
- `extractTokenFromCookie` (back) découpe tout le header `Cookie` sur `=` : si le navigateur envoie un 2e cookie sur `/auth/refresh`, le refresh échoue. À rendre robuste (parser chaque cookie séparé par `;`).

---

# 11. Offres de test, bouton recruteur, session sans 401

## Pourquoi il y avait un 401 sur `/app`
L'access token est gardé **en mémoire** (Zustand, pas le `localStorage`, pour limiter le risque XSS). Au rechargement, il disparaît : la 1re requête partait sans token → **401** → l'intercepteur appelait `/auth/refresh` (cookie) → la requête était rejouée. Ce n'était pas un bug, c'était le mécanisme de reconnexion.

**Maintenant** : `hooks/useRestoreSession.ts` (appelé dans `pages/Root.tsx`) appelle `/auth/refresh` **au démarrage**, avant d'afficher les pages `/app` (loader en attendant). Plus de 401 au rechargement.
- Via `useQuery` : les appels simultanés sont fusionnés (StrictMode monte 2 fois en dev) → un seul refresh, sinon le 2e échouerait à cause de la rotation du refresh token.
- Refresh impossible → toast « Session expirée, veuillez vous reconnecter » + retour à `/`.
- `useSyncCurrentUser` attend maintenant le token (`enabled: !!accessToken`).
- Déconnexion : navigation vers `/` **avant** `clearAuth()`, pour ne pas relancer un refresh au démarrage inutile.

## Bouton « Publier une offre » (recruteur)
`pages/Offers.tsx` : bouton **sous la liste des offres** (même style que « Ajouter une entreprise » de la page Relations : rond « + » sur mobile, pleine largeur avec libellé à partir de `sm`), visible si le user a un **emploi actuel** (le back refuse sinon). Il ouvre `JobOfferingForm` → `POST job_offering` → toast, `console.log` `[offres] offre publiée`, liste rechargée. « Mes offres » et « Candidatures reçues » restent en haut de la page.

## Données de test (créées via l'API)
Compte recruteur : **`recruteur.test@mail.com` / `Recruteur123!`**, rôle `recruteur`, entreprise **TestRecrut** (id 5), emploi actuel « Chargé de recrutement ».

12 offres créées avec `POST job_offering`, qui couvrent tous les badges :

| Badge | Offres |
|---|---|
| À distance | Développeur React, Chargé de communication digitale |
| Hybride | Développeur Back-end NestJS, Formateur développement web, Assistant comptable |
| Temps partiel | Technicien support IT, Réceptionniste d'hôtel, Conseiller de vente |
| Informatique | Développeur React, Développeur Back-end NestJS, Technicien support IT, developpeur php |
| 1 offre par autre secteur | Enseignement, Hôtellerie, Administration, Commerce, Transport, Santé, Industrie, Marketing, Finance |

**Anciennes offres** (créées avant l'ajout des champs) : mise à jour directe dans Mongo → `workMode: ON_SITE`, `partTime: false`, `location: null`, `category: null` ; « developpeur php » → `category: INFORMATIQUE`. Les valeurs par défaut Mongoose ne s'appliquent qu'aux nouveaux documents, d'où le besoin de cette mise à jour.

## Correctif
`api/company.api.ts` : `POST company` répond `{ data: { company }, message }` → `CompanyApi.create` renvoie maintenant `data.data.company` (avant, l'entreprise créée était `undefined` côté front).

---

# 12. Tests Cypress (e2e)

_Mise à jour : 25/09/2026_

## Lancer les tests

1. Démarrer le back (`job-searchBack` sur `:3000`, avec le ms et Docker) et le front (`npm run dev` sur `:5173`).
2. `npm run test:e2e` (runner graphique) ou `npm run test:e2e:headless` (terminal, sans pause).

Dans le runner graphique, chaque test **marque une pause de 2,5 s à la fin** pour laisser le temps d'observer l'écran (`TEST_PAUSE_MS` dans `cypress/support/e2e.ts`). Pas de pause en headless.

## Pourquoi les tests ne se connectaient plus

Depuis `useRestoreSession` (section 11), chaque `cy.visit("/app/...")` recharge la page et appelle `POST /auth/refresh`. Sans cookie dans Cypress, le refresh échouait → retour à `/`. Presque tous les specs étaient touchés.

## Deux modes de connexion (`cypress/support/commands.ts`)

| Commande | Principe | Specs |
|---|---|---|
| `cy.stubSession()` | `/auth/refresh` et `/user/profil` stubbés avec `fixtures/user.json` (Jean Dupont), sans back | `auth`, `navigation` |
| `cy.loginApi()` | **vrai compte** créé via `POST auth/register` (un par fichier de spec : `cypress.<horodatage>@test.fr` / `Cypress123!`), puis `POST auth/login` avec `cy.request` : le cookie refresh est posé et la session au chargement est réelle | `network`, `offers`, `profile` |

Aucune session n'est ajoutée par défaut : chaque spec choisit son mode. `allowCypressEnv: false` dans `cypress.config.ts` (`Cypress.env()` est déprécié en Cypress 15).

## Contenu des specs

| Spec | Données | Ce qui est testé |
|---|---|---|
| `auth.cy.ts` | stub | Connexion et inscription (inchangé) |
| `navigation.cy.ts` | stub | Header, menu latéral, thème, mobile (swipe, barre basse). **Retirés** : Actus, Statistiques, Déconnexion |
| `network.cy.ts` | **BDD** | Ajout de 2 entreprises, ajout d'un contact, validation des 2 formulaires (version d'origine, sur le vrai back) |
| `offers.cy.ts` | **BDD** (offres existantes) | Filtres (À distance, Hybride, Temps partiel, Informatique), recherche (mot tiré d'une vraie offre + recherche sans résultat), favoris (ajout → onglet Sauvegardées → retrait) |
| `profile.cy.ts` | **BDD** | Profil vide d'un compte neuf, puis édition identité + contacts via `PATCH user/profil`, avec vérification après rechargement |

**Supprimés** : `dashboard.cy.ts`, `documents.cy.ts`, `messaging.cy.ts`, `settings.cy.ts` (et la commande `cy.login` qui ne servait qu'à `settings`).

## Points techniques

- **Noms d'entreprise uniques** : le back refuse deux entreprises du même nom (409), les tests ajoutent un suffixe horodaté (`Acme Corp 1790…`).
- **Liste des entreprises** : elle contient aussi les entreprises déjà en BDD, une entreprise créée arrive en bas → `scrollIntoView()` avant `should("be.visible")`.
- **Cache HTTP (304)** : le back renvoie un `ETag`. Au 2e lancement, le navigateur revalide son cache et reçoit un **304 sans corps** : l'app lit sa copie en cache, mais le test ne voyait plus les offres. Les requêtes observées par `offers.cy.ts` partent donc sans `If-None-Match`.
- **Offres** : rien n'est codé en dur sur leur contenu ; chaque test lit la réponse du back et vérifie que l'affichage lui correspond (le back renvoie bien uniquement des offres qui respectent le filtre).
- **Contacts (Réseau)** : toujours en state local côté front (section 6) → créés en direct par le test mais **pas enregistrés en BDD**.
- **Compétences (Profil)** : `ProfileSkillsEdit.tsx` part encore d'une liste codée en dur et n'enregistre rien (`TODO PATCH /user/skills`). Seuls les tests d'ajout, indépendants de cette liste, sont gardés.

## Nettoyage de la BDD

En fin de spec (`after`), via l'API :

- `cy.cleanupTestCompanies(3)` (`network.cy.ts`) : supprime les entreprises créées par le compte de test, les plus récentes d'abord, **en gardant au moins 3 entreprises par secteur** (toutes entreprises confondues). La suppression est un soft delete (`deletedAt`) : les lignes restent en BDD mais ne sont plus listées.
- `cy.deleteTestUser()` (`network`, `offers`, `profile`) : `DELETE user/account`, suppression définitive du compte de test.

Les comptes laissés par les premiers lancements (avant ce nettoyage) ont été supprimés. Les 2 « Acme Corp » restent : le secteur « Informatique » n'en a que 2, sous le minimum de 3.

## Points d'attention

- Pour une suppression définitive des entreprises (pas un soft delete), il faudrait un accès direct à la BDD depuis Cypress (`cy.task` + client MySQL).
- Le refresh réel repose sur `extractTokenFromCookie` (section 10) : si le navigateur envoie un 2e cookie sur `/auth/refresh`, le refresh échoue et les specs « BDD » se retrouvent déconnectés.
