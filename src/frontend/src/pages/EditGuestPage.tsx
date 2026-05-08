import type { Guest } from "@/backend";
import { GuestForm } from "@/components/GuestForm";
import { Layout } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/hooks/useBackend";
import { useParams } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";

export function EditGuestPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { backend, isLoading: backendLoading } = useBackend();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const guestId = id ? BigInt(id) : undefined;

  useEffect(() => {
    if (!backend || backendLoading || !guestId) return;
    setLoading(true);
    backend
      .getGuest(guestId)
      .then((result) => {
        if (result === null) {
          setError("Guest not found.");
        } else {
          setGuest(result);
        }
      })
      .catch(() => setError("Failed to load guest."))
      .finally(() => setLoading(false));
  }, [backend, backendLoading, guestId]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Pencil className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Edit Guest
            </h1>
            <p className="text-sm text-muted-foreground">
              Update guest details — all fields are optional
            </p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm"
          data-ocid="edit_guest.page"
        >
          {loading || backendLoading ? (
            <div className="space-y-6" data-ocid="edit_guest.loading_state">
              {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
                <div key={k} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              className="flex flex-col items-center justify-center py-16 gap-3"
              data-ocid="edit_guest.error_state"
            >
              <p className="text-destructive font-medium">{error}</p>
              <p className="text-sm text-muted-foreground">
                Please go back and try again.
              </p>
            </div>
          ) : (
            <GuestForm mode="edit" existingGuest={guest} guestId={guestId} />
          )}
        </div>
      </div>
    </Layout>
  );
}
