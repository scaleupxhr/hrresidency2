import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Guest } from "@/types/guest";
import { format } from "date-fns";
import { Printer, X } from "lucide-react";

interface GuestDetailModalProps {
  guest: Guest | null;
  open: boolean;
  onClose: () => void;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-foreground break-words">
        {value !== undefined && value !== null && value !== "" ? (
          String(value)
        ) : (
          <span className="italic text-muted-foreground">Not provided</span>
        )}
      </span>
    </div>
  );
}

export function GuestDetailModal({
  guest,
  open,
  onClose,
}: GuestDetailModalProps) {
  if (!guest) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("guest-print-area");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(
      `<html><head><title>Guest Details - ${guest.guestName}</title><style>
        body { font-family: sans-serif; padding: 24px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .row label { font-size: 11px; text-transform: uppercase; color: #666; display: block; }
        .row span { font-size: 14px; }
        img { max-width: 200px; border-radius: 8px; }
      </style></head><body>${printContent.innerHTML}</body></html>`,
    );
    win.document.close();
    win.print();
  };

  const formatDateTime = (date: string, time: string) => {
    if (!date) return "—";
    try {
      return `${format(new Date(date), "dd MMM yyyy")}${time ? ` · ${time}` : ""}`;
    } catch {
      return `${date} ${time}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-ocid="guest_detail.dialog"
      >
        <DialogHeader className="flex flex-row items-start justify-between gap-4 pb-0">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-xl font-display font-bold text-foreground truncate">
              {guest.guestName || "Guest Details"}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={guest.checkedIn ? "default" : "secondary"}
                className={
                  guest.checkedIn ? "bg-primary text-primary-foreground" : ""
                }
              >
                {guest.checkedIn ? "Checked In" : "Checked Out"}
              </Badge>
              {guest.roomNumber && (
                <span className="text-sm text-muted-foreground">
                  Room {guest.roomNumber}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
              data-ocid="guest_detail.print_button"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
              data-ocid="guest_detail.close_button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div id="guest-print-area">
          {/* Guest Identity */}
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailRow label="Full Name" value={guest.guestName} />
              <DetailRow label="Phone Number" value={guest.phoneNumber} />
              <DetailRow label="Address" value={guest.address} />
              <DetailRow
                label="Number of Guests"
                value={Number(guest.numberOfGuests)}
              />
              <DetailRow
                label="Purpose of Visit"
                value={guest.purposeOfVisit}
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* ID Proof */}
          <div>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              Identity Document
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailRow label="ID Proof Type" value={guest.idProofType} />
              <DetailRow label="ID Proof Number" value={guest.idProofNumber} />
            </div>
            {guest.idProofImageUrl && guest.idProofImageUrl.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                  ID Proof{" "}
                  {guest.idProofImageUrl.length > 1 ? "Images" : "Image"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {guest.idProofImageUrl.map((url, i) => (
                    <img
                      key={url}
                      src={url}
                      alt={`ID Proof ${i + 1}`}
                      className="max-w-[180px] rounded-lg border border-border object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Stay Details */}
          <div>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              Stay Details
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailRow label="Room Number" value={guest.roomNumber} />
              <DetailRow label="Room Type" value={guest.roomType} />
              <DetailRow
                label="Check-in"
                value={formatDateTime(guest.checkInDate, guest.checkInTime)}
              />
              <DetailRow
                label="Check-out"
                value={formatDateTime(guest.checkOutDate, guest.checkOutTime)}
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Billing */}
          <div>
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              Billing & Records
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailRow label="GRC Number" value={guest.grcNumber} />
              <DetailRow label="Invoice Number" value={guest.invoiceNumber} />
              <DetailRow
                label="Amount Paid"
                value={
                  guest.amountPaid
                    ? `₹${guest.amountPaid.toLocaleString()}`
                    : undefined
                }
              />
              <DetailRow label="Payment Method" value={guest.paymentMethod} />
            </div>
          </div>

          {guest.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                  Notes
                </h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {guest.notes}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
