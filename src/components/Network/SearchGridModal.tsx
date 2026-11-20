import { useState, type ReactNode } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useSearchPageSize } from "../../hooks/useSearchPageSize";
import type { Paginated } from "../../types/company.types";

interface SearchGridModalProps<T> {
  title: string;
  searchPlaceholder: string;
  emptyMessage: string;
  // préfixe de la clé de cache (la recherche et la taille de page y sont ajoutées)
  queryKey: string;
  fetchPage: (params: { search?: string; skip: number; take: number }) => Promise<Paginated<T>>;
  getKey: (item: T) => number;
  renderItem: (item: T) => ReactNode;
  onClose: () => void;
}

// Modale de recherche : barre de recherche + grille de vignettes (3x3, 2x3 sur mobile) + "Charger plus"
export function SearchGridModal<T>({
  title,
  searchPlaceholder,
  emptyMessage,
  queryKey,
  fetchPage,
  getKey,
  renderItem,
  onClose,
}: SearchGridModalProps<T>) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const pageSize = useSearchPageSize();

  const query = useInfiniteQuery({
    queryKey: [queryKey, debouncedSearch, pageSize],
    queryFn: ({ pageParam }) =>
      fetchPage({ search: debouncedSearch || undefined, skip: pageParam, take: pageSize }),
    initialPageParam: 0,
    // page suivante tant que tout n'est pas chargé
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.data.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
  });
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return (
    <div className="modal modal-open" role="dialog" aria-label={title}>
      <div className="modal-box w-11/12 max-w-3xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="input input-bordered flex items-center gap-2 w-full mb-1">
          <Search className="w-4 h-4 opacity-60" />
          <input
            type="search"
            className="grow"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </label>
        <p className="text-xs text-base-content/60 mb-3">
          {query.isLoading ? "Recherche..." : `${total} résultat${total > 1 ? "s" : ""}`}
        </p>

        <div className="overflow-y-auto -mx-1 px-1 flex-1">
          {query.isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-base-content/60">{emptyMessage}</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((item) => (
                <li key={getKey(item)}>{renderItem(item)}</li>
              ))}
            </ul>
          )}

          {query.hasNextPage && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                disabled={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
              >
                {query.isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin" />}
                Charger plus
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
