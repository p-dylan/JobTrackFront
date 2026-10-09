import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import  { useAuthStore } from "../store/auth.store";
import { AuthApi, type RefreshResponse } from "../api/auth.api";
import { useToastStore } from "../store/toast.store";

//axios ne connaît pas option cacheable nativement
//cacheable ajouté ici pour ecrire : api.get('/offers', { cacheable: true })

declare module "axios" {
    export interface AxiosRequestConfig {
        cacheable?: boolean; //true active le cache ETag
    }
}

function axiosClient(): AxiosInstance {
    const api = axios.create({
        baseURL: `${import.meta.env.VITE_API_URL}/`,
        withCredentials: true,
    });

    // refresh en cours, partagé entre les requêtes qui reçoivent un 401 en même temps
    let refreshPromise: Promise<RefreshResponse> | null = null;

    //REQUEST INTERCEPTOR s'exécute avant chaque appel

    api.interceptors.request.use((config) => {
        //Authentification ajout token courant (stocké en mémoire via zustand, jamais en localstorage) sur chaque requête sortante.
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        //Cache ETage (seulement si requête est marqué "cacheable")
        //si ETag déja stocké pour cette URL+param, on glisse dans header I none Match
        //réponse serveur 304 si aucun changement, évite renvoi tout le body
        //Ne pas activer cacheable sur endpoint sensible (profil, notif,...)
        //localstorage => risque de faille XSS
        if (config.cacheable) {
            const cacheKey = buildCacheKey(config);
            const storedEtag = localStorage.getItem(`etag_${cacheKey}`);
            if (storedEtag) {
                config.headers["If-None-Match"] = storedEtag;
            }
        }
        return config;
    });

    //RESPONSE INTERCEPTOR s'éxecute après chaque réponse du serveur
    api.interceptors.response.use(
        //cas d'une réponse réussie
        (res) => {
            //Si la requête était cacheable et que le serveur a renvoyer un ETag 
            //on sauvegarde l'ETag + données reçu pour la prochaine requête
            if (res.config.cacheable) {
                const etag = res.headers["etag"];
                if (etag) {
                    const cacheKey = buildCacheKey(res.config);
                    localStorage.setItem(`etag_${cacheKey}`, etag);
                    localStorage.setItem(`data_${cacheKey}`, JSON.stringify(res.data));
                }
            }
            //sans ce return, chaque appel api renvoie undefined
            return res;
        },
        //Cas d'une réponse en erreur
        async (error) => {
            const { addToast } = useToastStore.getState();
            //304 not found
            // confirmation du serveur que la donnée n'a pas changer depuis dernier ETag
            //rechercche de la donnée sauvegarder localement et renvoi response comme si reponse 200
            //pour que useQuery n'y voit que du feu
            if (error.response?.status === 304 && error.config?.cacheable) {
                const cacheKey = buildCacheKey(error.config);
                const cachedData = localStorage.getItem(`data_${cacheKey}`);
                if (cachedData) {
                    return Promise.resolve({
                        ...error.response,
                        data: JSON.parse(cachedData),
                    })
                }
                // Edge case : 304 reçu mais rien en cache local (ex: localStorage
                // vidé entre-temps). On laisse l'erreur remonter pour forcer
                // un refetch propre plutôt que de renvoyer des données vides.
            }
            // --- CAS 2 : 429 Too Many Requests ---
            // On prévient l'utilisateur via un toast, avec le délai d'attente
            // renvoyé par le serveur si disponible.
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers["retry-after"];
                const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
                addToast(`Trop de tentatives. Réessayer dans ${seconds} secondes.`, "warning");
                return Promise.reject(new Error(`Trop de tentatives. Réessayer dans ${seconds} secondes.`))
            }
            
            // --- CAS 3 : 401 Unauthorized (token expiré) ---
            // On tente UNE fois de rafraîchir le token via le refresh token
            // (cookie httpOnly, géré par withCredentials), puis on rejoue
            // automatiquement la requête d'origine avec le nouveau token.

            if (error.response?.status === 401) {
                const originalRequest = error.config;
                // _retry évite une boucle infinie si le refresh échoue aussi en 401
                if (originalRequest._retry) return Promise.reject(error);
                originalRequest._retry = true;

                try {

                    // Plusieurs requêtes en 401 en même temps (ex: rechargement du dashboard)
                    // partagent le même refresh : le back fait tourner le refresh token,
                    // un 2e refresh parallèle échouerait ("Tokens don't match") et déconnecterait.
                    if (!refreshPromise) {
                        console.log("[auth] 401 reçu, refresh du token...");
                    }
                    refreshPromise ??= AuthApi.refresh().finally(() => {
                        refreshPromise = null;
                    });
                    const { accessToken, user } = await refreshPromise;
                    console.log("[auth] token rafraîchi, requête rejouée :", originalRequest.url);

                    useAuthStore.getState().setAccessToken(accessToken);
                    useAuthStore.getState().setUser(user);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest); // on rejoue la requête initiale

                } catch (refreshError) {
                    // Le refresh a échoué : session vraiment terminée,
                    // on nettoie l'état et on redirige vers le login.
                    console.log("[auth] refresh impossible, session terminée => retour à la connexion");
                    useAuthStore.getState().clearAuth();
                    window.location.href = "/"; // page de connexion (Home), /login n'existe pas
                    return Promise.reject(refreshError);
                }
            }
            // --- Tout autre code d'erreur : on laisse remonter tel quel ---
            return Promise.reject(error)
        }
    );
    return api
}

// ============================================================
// CLÉ DE CACHE
// ============================================================
// Construit une clé unique par URL + paramètres de requête (config.params).
// Utile si un jour la pagination passe par axios params (ex: { page, limit })
// plutôt que directement dans l'URL — sinon toutes les pages partageraient
// la même clé et s'écraseraient entre elles.
// Dans ton cas actuel (URL construite à la main), params sera vide et la clé
// se réduit simplement à l'URL — pas de comportement différent.
function buildCacheKey(config: AxiosRequestConfig): string {
    const params = config.params ? JSON.stringify(config.params) : "";
    return `${config.url}${params}`;
}

export const api = axiosClient();