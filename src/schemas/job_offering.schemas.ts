import { z } from "zod";

export const jobOfferingSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(150, "150 caractères maximum"),
  description: z.string().trim().min(1, "Description requise"),
  contractType: z.enum(["CDI", "CDD", "FREELANCE", "STAGE"]),
  workMode: z.enum(["ON_SITE", "REMOTE", "HYBRID"]),
  partTime: z.boolean(),
  // "" = aucune catégorie (option vide du select)
  category: z.union([
    z.enum([
      "INFORMATIQUE",
      "ENSEIGNEMENT",
      "HOTELLERIE",
      "ADMINISTRATION",
      "COMMERCE",
      "TRANSPORT",
      "SANTE",
      "INDUSTRIE",
      "MARKETING",
      "FINANCE",
    ]),
    z.literal(""),
  ]),
  location: z.string().trim().max(255, "255 caractères maximum"),
});

export type JobOfferingFormData = z.infer<typeof jobOfferingSchema>;
