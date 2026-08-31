import { z } from "zod";
import { passwordSchema } from "./password.schema";

const email = z.email("Email invalide");

export const loginSchema = z.object({ email, password: passwordSchema });
export const signupSchema = z.object({
  last_name: z.string().min(2, "Nom trop court"),
  first_name: z.string().min(2, "Nom trop court"),
  email,
  password: passwordSchema,
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_password"], // path of error
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
