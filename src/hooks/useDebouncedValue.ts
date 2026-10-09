import { useEffect, useState } from "react";

// Retarde la mise à jour d'une valeur (ex: recherche) pour ne pas appeler
// l'API à chaque frappe.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
