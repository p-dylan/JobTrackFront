import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupValues } from "../../schemas/auth.schemas";
import { FieldError } from "./FieldError";
import { BTN_FOCUS_RING, INPUT_CLASS } from "../../constants/styles";
import { AuthApi } from "../../api/auth.api";
import { useToastStore } from "../../store/toast.store";
import { useNavigate } from "react-router";

export function SignupForm() {
    const navigate = useNavigate(); // Hook de navigation de react-router-dom

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

    const onSubmit = async (values: SignupValues) => {
        try {
            const { confirm_password: _confirm_password, ...signupData } =
                values; // Exclut confirm_password de l'objet envoyé à l'API
            // Ici, vous pouvez appeler votre API pour créer un compte utilisateur
            await AuthApi.register(signupData); // Appel à l'API pour s'inscrire
            useToastStore
                .getState()
                .addToast(
                    "Inscription réussie ! Vous pouvez maintenant vous connecter.",
                    "success",
                );
            navigate("/app"); // Redirige vers la page de connexion après inscription réussie
        } catch {
            useToastStore
                .getState()
                .addToast(
                    "Une erreur est survenue lors de l'inscription. Veuillez réessayer.",
                    "error",
                );
        }
    };

    return (
        <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
        >
            <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                    Nom
                </span>
                <input
                    type="text"
                    autoComplete="lastName"
                    placeholder="Dupont"
                    className={INPUT_CLASS}
                    {...register("last_name")} // connecte ce champ à react-hook-form sous la clé "last_name"
                />
                <FieldError error={errors.last_name} />
            </label>
            <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                    Prénom
                </span>
                <input
                    type="text"
                    autoComplete="firstName"
                    placeholder="Jean"
                    className={INPUT_CLASS}
                    {...register("first_name")} // connecte ce champ à react-hook-form sous la clé "first_name"
                />
                <FieldError error={errors.first_name} />
            </label>

            <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                    Email
                </span>
                <input
                    type="email"
                    autoComplete="email"
                    placeholder="jean.dupont@email.fr"
                    className={INPUT_CLASS}
                    {...register("email")}
                />
                <FieldError error={errors.email} />
            </label>

            <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                    Mot de passe
                </span>
                <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={INPUT_CLASS}
                    {...register("password")}
                />
                <FieldError error={errors.password} />
            </label>

            <label className="block">
                <span className="text-sm text-base-content/70 mb-1 block">
                    Confirmer le mot de passe
                </span>
                <input
                    type="password"
                    autoComplete="confirm-password"
                    placeholder="••••••••"
                    className={INPUT_CLASS}
                    {...register("confirm_password")}
                />
                <FieldError error={errors.confirm_password} />
            </label>

            <button
                type="submit"
                className={`btn btn-primary w-full mt-2 ${BTN_FOCUS_RING.primary}`}
            >
                Créer mon compte
            </button>
        </form>
    );
}
