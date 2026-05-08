import { GuestDetailModal } from "@/components/GuestDetailModal";
import { GuestTable } from "@/components/GuestTable";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBackend } from "@/hooks/useBackend";
import type { Guest, GuestId, SearchParams } from "@/types/guest";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 50n;

export function TrashPage() {
  const { backend, isLoading: actorLoading } = useBackend();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1n);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [restoringId, setRestoringId] = useState<GuestId | null>(null);
  const [hardDeletingId, setHardDeletingId] = useState<GuestId | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1n);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const searchParams: SearchParams = {
    page: currentPage,
    limit: PAGE_SIZE,
    includeDeleted: true,
    searchTerm: debouncedSearch || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const { data, isFetching } = useQuery({
    queryKey: ["trash", searchParams],
    queryFn: async () => {
      if (!backend) return { guests: [], total: 0n, page: 1n, totalPages: 1n };
      const result = await backend.getGuests(searchParams);
      // Filter to only deleted guests
      return {
        ...result,
        guests: result.guests.filter((g) => g.isDeleted),
      };
    },
    enabled: !!backend && !actorLoading,
    placeholderData: (prev) => prev,
  });

  const guests = data?.guests ?? [];
  // Use filtered guest count so display count matches visible rows (not raw backend total)
  const totalGuests =
    guests.length + (Number(currentPage) - 1) * Number(PAGE_SIZE);
  const totalPages = Number(data?.totalPages ?? 1n);
  const pageNum = Number(currentPage);

  const restoreMutation = useMutation({
    mutationFn: async (id: GuestId) => {
      if (!backend) throw new Error("Not connected");
      return backend.restoreGuest(id);
    },
    onMutate: (id) => setRestoringId(id),
    onSuccess: (ok) => {
      if (ok) {
        toast.success("Guest restored successfully");
        queryClient.invalidateQueries({ queryKey: ["trash"] });
        queryClient.invalidateQueries({ queryKey: ["guests"] });
      } else {
        toast.error("Could not restore guest");
      }
    },
    onError: () => toast.error("Restore failed. Please try again."),
    onSettled: () => setRestoringId(null),
  });

  const hardDeleteMutation = useMutation({
    mutationFn: async (id: GuestId) => {
      if (!backend) throw new Error("Not connected");
      return backend.hardDeleteGuest(id);
    },
    onMutate: (id) => setHardDeletingId(id),
    onSuccess: (ok) => {
      if (ok) {
        toast.success("Guest permanently deleted");
        queryClient.invalidateQueries({ queryKey: ["trash"] });
      } else {
        toast.error("Could not delete guest permanently");
      }
    },
    onError: () => toast.error("Permanent delete failed. Please try again."),
    onSettled: () => setHardDeletingId(null),
  });

  const handleRestore = useCallback(
    (id: GuestId) => {
      restoreMutation.mutate(id);
    },
    [restoreMutation],
  );

  const handleHardDelete = useCallback(
    (id: GuestId) => {
      hardDeleteMutation.mutate(id);
    },
    [hardDeleteMutation],
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setFromDate("");
    setToDate("");
    setCurrentPage(1n);
  };

  const hasFilters = debouncedSearch || fromDate || toDate;

  return (
    <Layout>
      <div className="space-y-5" data-ocid="trash_page">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Trash
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalGuests.toLocaleString()} deleted guest
              {totalGuests !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              Soft-deleted records — restore to recover
            </span>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search deleted guests…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card"
              data-ocid="trash.search_input"
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1n);
              }}
              className="w-36 bg-card text-sm"
              data-ocid="trash.from_date_input"
            />
            <span className="text-muted-foreground text-sm">–</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1n);
              }}
              className="w-36 bg-card text-sm"
              data-ocid="trash.to_date_input"
            />
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
                data-ocid="trash.clear_filters_button"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <GuestTable
          guests={guests}
          isLoading={(actorLoading || isFetching) && guests.length === 0}
          isTrash
          restoringId={restoringId}
          hardDeletingId={hardDeletingId}
          onRestore={handleRestore}
          onHardDelete={handleHardDelete}
          onRowClick={setSelectedGuest}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Page {pageNum} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNum <= 1 || isFetching}
                onClick={() => setCurrentPage((p) => p - 1n)}
                className="gap-1.5"
                data-ocid="trash.pagination_prev"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNum >= totalPages || isFetching}
                onClick={() => setCurrentPage((p) => p + 1n)}
                className="gap-1.5"
                data-ocid="trash.pagination_next"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Guest detail modal */}
      <GuestDetailModal
        guest={selectedGuest}
        open={selectedGuest !== null}
        onClose={() => setSelectedGuest(null)}
      />
    </Layout>
  );
}
