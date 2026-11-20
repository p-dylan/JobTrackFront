import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "../../schemas/auth.schemas";
import { FieldError } from "./FieldError";
import { BTN_FOCUS_RING, INPUT_CLASS } from "../../constants/styles";
import { AuthApi } from "../../api/auth.api";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../store/auth.store";
import { useToastStore } from "../../store/toast.store";
import { GoogleLogin } from "@react-oauth/google";

/**
 * LoginForm
 * Formulaire de connexion : email + mot de passe.
 * Validation gérée par react-hook-form + un schéma Zod (loginSchema),
 * via zodResolver qui fait le pont entre les deux.
 */
export function LoginForm() {

  const navigate = useNavigate(); // Hook de navigation de react-router-dom

  const {
    register, // permet de "brancher" un input non-contrôlé au formulaire
    handleSubmit, // wrapper qui valide les données avant d'appeler onSubmit
    formState: { errors }, // erreurs de validation par champ (générées par Zod)
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  // Handler appelé uniquement si la validation Zod passe.

  const onSubmit = async (values: LoginValues) => {
    try {
      const { accessToken, user } = await AuthApi.login(values); // Appel à l'API pour se connecter
      
      useAuthStore.getState().setAccessToken(accessToken); // Stocke le token dans le store Zustand
      useAuthStore.getState().setUser(user); // Stocke l'utilisateur dans le store Zustand

      navigate("/app"); // Redirige vers le dashboard après connexion réussie

    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      // 429 : déjà signalé par un toast dans l'intercepteur axios (l'erreur n'est plus une erreur axios)
      if (!isAxiosError(error)) return;
      // 400 = identifiants refusés ; le reste (500, serveur injoignable) n'est pas une erreur de saisie
      useToastStore.getState().addToast(
        error.response?.status === 400
          ? "Email ou mot de passe incorrect."
          : "Service indisponible, veuillez réessayer dans quelques instants.",
        "error"
      );
    }
    
  };

  const onGoogleSuccess = async (credential?: string) => {
    if (!credential) return;
    try {
      const { accessToken, user } = await AuthApi.googleLogin(credential);

      useAuthStore.getState().setAccessToken(accessToken);
      useAuthStore.getState().setUser(user);

      navigate("/app");
    } catch (error) {
      console.error("Erreur connexion Google :", error);
      useToastStore
        .getState()
        .addToast("Connexion Google impossible.", "error");
    }
  };

  return (
    // noValidate désactive la validation native du navigateur (bulles HTML5)
    // pour laisser Zod/react-hook-form gérer entièrement l'affichage des erreurs
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Champ Email */}
      <label className="block">
        <span className="text-sm text-base-content/70 mb-1 block">Email</span>
        <input
          type="email"
          autoComplete="email" // aide au remplissage auto + gestionnaires de mots de passe
          placeholder="jean.dupont@email.fr"
          className={INPUT_CLASS}
          {...register("email")} // connecte ce champ à react-hook-form sous la clé "email"
        />
        {/* Affiche le message d'erreur Zod pour ce champ, si présent */}
        <FieldError error={errors.email} />
      </label>

      {/* Champ Mot de passe */}
      <label className="block">
        <span className="text-sm text-base-content/70 mb-1 block">
          Mot de passe
        </span>
        <input
          type="password"
          autoComplete="current-password" // suggère au navigateur un mdp déjà connu (≠ "new-password")
          placeholder="••••••••"
          className={INPUT_CLASS}
          {...register("password")}
        />
        <FieldError error={errors.password} />
      </label>

      <button
        type="submit"
        className={`btn btn-primary w-full mt-2 ${BTN_FOCUS_RING.primary}`}
      >
        Se connecter
      </button>
      <GoogleLogin
        onSuccess={(res) => onGoogleSuccess(res.credential)}
        onError={() =>
          useToastStore
          .getState()
          .addToast("Connexion Google annulé ou échoué.", "error")
         }
      />
    </form>
  );
}
