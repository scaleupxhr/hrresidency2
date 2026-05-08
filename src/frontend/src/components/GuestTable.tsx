import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Guest, GuestId } from "@/types/guest";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { Edit2, RotateCcw, Trash2, X } from "lucide-react";

interface GuestTableProps {
  guests: Guest[];
  isLoading: boolean;
  isTrash?: boolean;
  deletingId?: GuestId | null;
  restoringId?: GuestId | null;
  hardDeletingId?: GuestId | null;
  onDelete?: (id: GuestId) => void;
  onRestore?: (id: GuestId) => void;
  onHardDelete?: (id: GuestId) => void;
  onRowClick: (guest: Guest) => void;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd MMM yyyy");
  } catch {
    return dateStr;
  }
}

function paymentBadgeClass(method: string) {
  switch (method) {
    case "Cash":
      return "bg-primary/10 text-primary border-primary/20";
    case "UPI":
      return "bg-primary/15 text-primary border-primary/25";
    case "Card":
      return "bg-muted text-foreground border-border";
    case "Online":
      return "bg-muted/80 text-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function GuestTable({
  guests,
  isLoading,
  isTrash = false,
  deletingId,
  restoringId,
  hardDeletingId,
  onDelete,
  onRestore,
  onHardDelete,
  onRowClick,
}: GuestTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {[
                "Guest Name",
                "Phone",
                "Room",
                "Check-in",
                "Check-out",
                "GRC",
                "Invoice",
                "Amount",
                "Payment",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["r1", "r2", "r3", "r4", "r5"].map((rk) => (
              <tr key={rk} className="border-b border-border last:border-0">
                {[
                  "c1",
                  "c2",
                  "c3",
                  "c4",
                  "c5",
                  "c6",
                  "c7",
                  "c8",
                  "c9",
                  "c10",
                  "c11",
                ].map((ck) => (
                  <td key={ck} className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!guests.length) {
    return (
      <div
        data-ocid="guest_table.empty_state"
        className="flex flex-col items-center justify-center py-20 rounded-lg border border-dashed border-border bg-card text-center gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          {isTrash ? (
            <Trash2 className="w-7 h-7 text-muted-foreground" />
          ) : (
            <svg
              className="w-7 h-7 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          )}
        </div>
        <div>
          <p className="font-display font-semibold text-foreground">
            {isTrash ? "Trash is empty" : "No guests found"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isTrash
              ? "Deleted guests will appear here"
              : "Try adjusting your search or date filters"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {[
              "Guest Name",
              "Phone",
              "Room",
              "Check-in",
              "Check-out",
              "GRC",
              "Invoice",
              "Amount",
              "Payment",
              "Status",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guests.map((guest, index) => {
            const isDeleting = deletingId === guest.id;
            const isRestoring = restoringId === guest.id;
            const isHardDeleting = hardDeletingId === guest.id;
            const isBusy = isDeleting || isRestoring || isHardDeleting;
            return (
              <tr
                key={String(guest.id)}
                data-ocid={`guest_table.item.${index + 1}`}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                tabIndex={0}
                onClick={() => onRowClick(guest)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onRowClick(guest);
                }}
              >
                <td className="px-4 py-3 font-medium text-foreground min-w-[140px]">
                  <span className="line-clamp-1">{guest.guestName || "—"}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {guest.phoneNumber || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {guest.roomNumber || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(guest.checkInDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(guest.checkOutDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {guest.grcNumber || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {guest.invoiceNumber || "—"}
                </td>
                <td className="px-4 py-3 text-foreground whitespace-nowrap font-medium tabular-nums">
                  {guest.amountPaid
                    ? `₹${guest.amountPaid.toLocaleString()}`
                    : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${paymentBadgeClass(
                      guest.paymentMethod,
                    )}`}
                  >
                    {guest.paymentMethod}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge
                    variant={guest.checkedIn ? "default" : "secondary"}
                    className={
                      guest.checkedIn
                        ? "bg-primary text-primary-foreground text-xs"
                        : "text-xs"
                    }
                  >
                    {guest.checkedIn ? "Checked In" : "Checked Out"}
                  </Badge>
                </td>
                <td
                  className="px-4 py-3 whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    {isTrash ? (
                      <>
                        {/* Restore */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => onRestore?.(guest.id)}
                          className="gap-1.5 h-7 px-2 text-xs"
                          data-ocid={`guest_table.restore_button.${index + 1}`}
                        >
                          {isRestoring ? (
                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Restore
                        </Button>
                        {/* Permanent Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={isBusy}
                              className="gap-1.5 h-7 px-2 text-xs"
                              data-ocid={`guest_table.hard_delete_button.${index + 1}`}
                            >
                              {isHardDeleting ? (
                                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                              Delete Forever
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-ocid="guest_table.hard_delete_dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Permanently delete guest?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove{" "}
                                <strong>{guest.guestName}</strong> from the
                                system. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="guest_table.hard_delete_cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onHardDelete?.(guest.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-ocid="guest_table.hard_delete_confirm_button"
                              >
                                Delete Forever
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <>
                        {/* Edit */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() =>
                            navigate({
                              to: "/guests/$id/edit",
                              params: { id: String(guest.id) },
                            })
                          }
                          className="gap-1.5 h-7 px-2 text-xs"
                          data-ocid={`guest_table.edit_button.${index + 1}`}
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </Button>
                        {/* Soft Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={isBusy}
                              className="gap-1.5 h-7 px-2 text-xs"
                              data-ocid={`guest_table.delete_button.${index + 1}`}
                            >
                              {isDeleting ? (
                                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-ocid="guest_table.delete_dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Move guest to trash?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{guest.guestName}</strong> will be moved
                                to the trash. You can restore them later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="guest_table.delete_cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete?.(guest.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-ocid="guest_table.delete_confirm_button"
                              >
                                Move to Trash
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
