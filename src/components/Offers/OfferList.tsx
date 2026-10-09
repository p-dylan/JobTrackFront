import { OfferCard } from "./OfferCard";
import type { JobOffering } from "../../types/job_offering.type";
import { CONTRACT_TYPE_LABEL } from "../../constants/job_offering";
import { timeAgo } from "../../utils/timeAgo";

interface OfferListProps {
  offers: JobOffering[];
  getCompanyName: (companyId: number) => string;
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onDismiss?: (id: string) => void;
}

// Transforme les offres du ms en cartes (nom d'entreprise, libellé du contrat, "il y a Xh").
export function OfferList({
  offers,
  getCompanyName,
  savedIds,
  onToggleSave,
  onDismiss,
}: OfferListProps) {
  return (
    <div className="divide-y divide-base-200">
      {offers.map((offer) => (
        <OfferCard
          key={offer._id}
          to={`/app/offers/${offer._id}`}
          role={offer.title}
          company={getCompanyName(offer.companyId)}
          contractLabel={
            offer.partTime
              ? `${CONTRACT_TYPE_LABEL[offer.contractType]} · Temps partiel`
              : CONTRACT_TYPE_LABEL[offer.contractType]
          }
          location={offer.location}
          timeAgo={timeAgo(offer.createdAt)}
          workMode={offer.workMode}
          saved={savedIds.includes(offer._id)}
          onToggleSave={() => onToggleSave(offer._id)}
          onDismiss={onDismiss ? () => onDismiss(offer._id) : undefined}
        />
      ))}
    </div>
  );
}
