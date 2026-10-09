import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobOfferingSchema, type JobOfferingFormData } from "../../schemas/job_offering.schemas";
import { FieldError } from "../Auth/FieldError";
import { INPUT_CLASS, TEXTAREA_CLASS } from "../../constants/styles";
import {
  CONTRACT_TYPE_LABEL,
  OFFER_CATEGORY_LABEL,
  WORK_MODE_LABEL,
} from "../../constants/job_offering";
import type { CreateJobOfferingData, JobOffering } from "../../types/job_offering.type";

type Props = {
  initialData?: JobOffering | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateJobOfferingData) => void;
};

// Modale création / édition d'une offre (même pattern que CompanyForm).
export function JobOfferingForm({ initialData, isSubmitting, onClose, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobOfferingFormData>({
    resolver: zodResolver(jobOfferingSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      contractType: initialData?.contractType ?? "CDI",
      workMode: initialData?.workMode ?? "ON_SITE",
      partTime: initialData?.partTime ?? false,
      category: initialData?.category ?? "",
      location: initialData?.location ?? "",
    },
  });

  // Les champs optionnels vides ne sont pas envoyés (le DTO back les rejette sinon).
  const submit = (values: JobOfferingFormData) => {
    onSubmit({
      title: values.title,
      description: values.description,
      contractType: values.contractType,
      workMode: values.workMode,
      partTime: values.partTime,
      category: values.category || undefined,
      location: values.location || undefined,
    });
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">
          {initialData ? "Modifier l'offre" : "Publier une offre"}
        </h3>
        <form onSubmit={handleSubmit(submit)} className="space-y-3" noValidate>
          <label className="block">
            <span className="text-sm text-base-content/70 mb-1 block">Titre du poste</span>
            <input {...register("title")} className={INPUT_CLASS} />
            <FieldError error={errors.title?.message} />
          </label>

          <label className="block">
            <span className="text-sm text-base-content/70 mb-1 block">Description</span>
            <textarea {...register("description")} rows={5} className={TEXTAREA_CLASS} />
            <FieldError error={errors.description?.message} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-base-content/70 mb-1 block">Contrat</span>
              <select {...register("contractType")} className="select select-bordered w-full">
                {Object.entries(CONTRACT_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-base-content/70 mb-1 block">Mode de travail</span>
              <select {...register("workMode")} className="select select-bordered w-full">
                {Object.entries(WORK_MODE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-base-content/70 mb-1 block">Secteur</span>
            <select {...register("category")} className="select select-bordered w-full">
              <option value="">Non précisé</option>
              {Object.entries(OFFER_CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-base-content/70 mb-1 block">Lieu (optionnel)</span>
            <input {...register("location")} placeholder="Nice, France" className={INPUT_CLASS} />
            <FieldError error={errors.location?.message} />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("partTime")} className="checkbox checkbox-sm" />
            Temps partiel
          </label>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
