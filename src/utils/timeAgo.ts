// "Il y a 2h", "Il y a 3j"... à partir d'une date ISO (createdAt des offres).
export function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 60) return minutes <= 1 ? "À l'instant" : `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days}j`;
  const months = Math.floor(days / 30);
  return `Il y a ${months} mois`;
}

// Date ISO => "24/09/2026".
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("fr-FR");
}
