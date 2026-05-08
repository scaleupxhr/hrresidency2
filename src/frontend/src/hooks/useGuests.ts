import { createActor } from "@/backend";
import type {
  DashboardStats,
  Guest,
  GuestId,
  GuestInput,
  GuestPage,
  SearchParams,
} from "@/types/guest";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// --------------- Query Keys ---------------
export const QUERY_KEYS = {
  dashboardStats: ["dashboardStats"] as const,
  guests: (params: Partial<SearchParams>) => ["guests", params] as const,
  guest: (id: GuestId) => ["guest", id.toString()] as const,
};

// --------------- Dashboard Stats ---------------
export function useDashboardStats(enabled = true) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<DashboardStats>({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: async () => {
      if (!actor) {
        return {
          totalGuests: 0n,
          todayCheckIns: 0n,
          todayCheckOuts: 0n,
          totalRevenue: 0,
          paymentMethodBreakdown: {
            cash: 0,
            upi: 0,
            online: 0,
            card: 0,
            other: 0,
          },
        };
      }
      return actor.getDashboardStats();
    },
    enabled: enabled && !!actor && !isFetching,
    refetchInterval: (query) => {
      // pause polling when document is hidden
      if (typeof document !== "undefined" && document.hidden) return false;
      // only poll if we have a successful fetch and have data
      if (query.state.status === "success") return 30_000;
      return false;
    },
    staleTime: 20_000,
  });
}

// --------------- Guests List ---------------
export function useGuests(params: Partial<SearchParams> = {}) {
  const { actor, isFetching } = useActor(createActor);

  const defaultParams: SearchParams = {
    page: 1n,
    limit: 10n,
    includeDeleted: false,
    ...params,
  };

  return useQuery<GuestPage>({
    queryKey: QUERY_KEYS.guests(defaultParams),
    queryFn: async () => {
      if (!actor) {
        return { guests: [], total: 0n, page: 1n, totalPages: 0n };
      }
      return actor.getGuests(defaultParams);
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });
}

// --------------- Recent Guests (last 10, with optional date range) ---------------
export function useRecentGuests(params: {
  fromDate?: string;
  toDate?: string;
}) {
  const { actor, isFetching } = useActor(createActor);

  const searchParams: SearchParams = {
    page: 1n,
    limit: 10n,
    includeDeleted: false,
    ...(params.fromDate ? { fromDate: params.fromDate } : {}),
    ...(params.toDate ? { toDate: params.toDate } : {}),
  };

  return useQuery<GuestPage>({
    queryKey: QUERY_KEYS.guests(searchParams),
    queryFn: async () => {
      if (!actor) return { guests: [], total: 0n, page: 1n, totalPages: 0n };
      return actor.getGuests(searchParams);
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });
}

// --------------- Toggle Check-in ---------------
export function useToggleCheckIn() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<boolean | null, Error, GuestId>({
    mutationFn: async (id: GuestId) => {
      if (!actor) throw new Error("Backend unavailable");
      return actor.toggleGuestCheckIn(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
    onError: () => {
      toast.error("Failed to update check-in status. Please try again.");
    },
  });
}

// --------------- Delete Guest (soft) ---------------
export function useDeleteGuest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, GuestId>({
    mutationFn: async (id: GuestId) => {
      if (!actor) throw new Error("Backend unavailable");
      return actor.deleteGuest(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast.success("Guest moved to trash.");
    },
    onError: () => {
      toast.error("Failed to delete guest. Please try again.");
    },
  });
}

// --------------- Add Guest ---------------
export function useAddGuest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<Guest, Error, GuestInput>({
    mutationFn: async (input: GuestInput) => {
      if (!actor) throw new Error("Backend unavailable");
      return actor.addGuest(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
    onError: () => {
      toast.error("Failed to add guest. Please try again.");
    },
  });
}

// --------------- Update Guest ---------------
export function useUpdateGuest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: GuestId; input: GuestInput }>({
    mutationFn: async ({ id, input }) => {
      if (!actor) throw new Error("Backend unavailable");
      return actor.updateGuest(id, input);
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.guest(id) });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
      toast.success("Guest updated successfully.");
    },
    onError: () => {
      toast.error("Failed to update guest. Please try again.");
    },
  });
}

// --------------- Single Guest ---------------
export function useGuest(id: GuestId | null) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<Guest | null>({
    queryKey: QUERY_KEYS.guest(id ?? 0n),
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getGuest(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    staleTime: 30_000,
  });
}
