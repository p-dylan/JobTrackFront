import { useState } from "react";

// Taille de page des modales de recherche, choisie à l'ouverture selon la largeur d'écran :
// 9 vignettes (3 colonnes x 3 lignes) dès 640px, 6 (2 x 3) sur mobile.
export function useSearchPageSize(): number {
  const [pageSize] = useState(() =>
    window.matchMedia("(min-width: 640px)").matches ? 9 : 6,
  );
  return pageSize;
}
