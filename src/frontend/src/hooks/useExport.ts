import { createActor } from "@/backend";
import type { ExportFilters, Guest } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useState } from "react";
import * as XLSX from "xlsx";

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function escapeCsvValue(value: string | number | undefined | null): string {
  const str = value == null ? "" : String(value);
  // Wrap in quotes if contains comma, newline, or double-quote
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const CSV_HEADERS = [
  "Guest Name",
  "Phone Number",
  "Address",
  "ID Proof Type",
  "ID Proof Number",
  "Check-in Date",
  "Check-out Date",
  "Room Number",
  "Room Type",
  "Number of Guests",
  "Purpose of Visit",
  "GRC Number",
  "Invoice Number",
  "Amount Paid",
  "Payment Method",
  "Notes",
  "Record Created Date",
];

function formatDate(dateStr: string, timeStr?: string): string {
  if (!dateStr) return "";
  if (timeStr) return `${dateStr} ${timeStr}`;
  return dateStr;
}

function formatTimestamp(ts: bigint): string {
  if (!ts) return "";
  // Motoko Time is nanoseconds since epoch
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function guestToRow(g: Guest): string[] {
  return [
    g.guestName,
    g.phoneNumber,
    g.address,
    g.idProofType,
    g.idProofNumber,
    formatDate(g.checkInDate, g.checkInTime),
    formatDate(g.checkOutDate, g.checkOutTime),
    g.roomNumber,
    g.roomType,
    String(g.numberOfGuests),
    g.purposeOfVisit,
    g.grcNumber,
    g.invoiceNumber,
    String(g.amountPaid),
    g.paymentMethod,
    g.notes,
    formatTimestamp(g.createdAt),
  ];
}

function buildCsv(guests: Guest[]): string {
  const lines: string[] = [CSV_HEADERS.map(escapeCsvValue).join(",")];
  for (const g of guests) {
    lines.push(guestToRow(g).map(escapeCsvValue).join(","));
  }
  return lines.join("\r\n");
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Excel helpers ────────────────────────────────────────────────────────────

const EXCEL_COL_WIDTHS = [
  { wch: 25 }, // Guest Name
  { wch: 15 }, // Phone
  { wch: 30 }, // Address
  { wch: 20 }, // ID Proof Type
  { wch: 20 }, // ID Proof Number
  { wch: 20 }, // Check-in Date
  { wch: 20 }, // Check-out Date
  { wch: 12 }, // Room Number
  { wch: 18 }, // Room Type
  { wch: 18 }, // Number of Guests
  { wch: 22 }, // Purpose of Visit
  { wch: 18 }, // GRC Number
  { wch: 18 }, // Invoice Number
  { wch: 14 }, // Amount Paid
  { wch: 16 }, // Payment Method
  { wch: 30 }, // Notes
  { wch: 22 }, // Record Created Date
];

function downloadExcel(guests: Guest[], filename: string): void {
  const data = guests.map((g) => {
    const row = guestToRow(g);
    return Object.fromEntries(CSV_HEADERS.map((h, i) => [h, row[i]]));
  });
  const ws = XLSX.utils.json_to_sheet(data, { header: CSV_HEADERS });
  ws["!cols"] = EXCEL_COL_WIDTHS;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Guests");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Timestamp filename helper ───────────────────────────────────────────────

function timestampFilename(prefix: string, ext: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = `${d.getFullYear()}_${pad(d.getMonth() + 1)}_${pad(d.getDate())}_${pad(d.getHours())}_${pad(d.getMinutes())}`;
  return `${prefix}_${ts}.${ext}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export type ExportFormat = "csv" | "xlsx";

export interface UseExportReturn {
  isExporting: boolean;
  exportGuests: (
    filters: ExportFilters,
    format: ExportFormat,
    filenamePrefix: string,
    overrideGuests?: Guest[],
  ) => Promise<string | null>;
}

export function useExport(): UseExportReturn {
  const { actor } = useActor(createActor);
  const [isExporting, setIsExporting] = useState(false);

  async function exportGuests(
    filters: ExportFilters,
    format: ExportFormat,
    filenamePrefix: string,
    overrideGuests?: Guest[],
  ): Promise<string | null> {
    setIsExporting(true);
    try {
      let guests: Guest[];
      if (overrideGuests !== undefined) {
        guests = overrideGuests;
      } else {
        if (!actor) throw new Error("Backend unavailable");
        guests = await actor.getAllGuestsForExport(filters);
      }

      const filename = timestampFilename(
        filenamePrefix,
        format === "csv" ? "csv" : "xlsx",
      );

      if (format === "csv") {
        downloadCsv(buildCsv(guests), filename);
      } else {
        downloadExcel(guests, filename);
      }

      return filename;
    } finally {
      setIsExporting(false);
    }
  }

  return { isExporting, exportGuests };
}
