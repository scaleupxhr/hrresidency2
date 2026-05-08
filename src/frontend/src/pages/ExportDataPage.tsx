import { createActor } from "@/backend";
import type { ExportFilters, Guest } from "@/backend";
import { Layout } from "@/components/Layout";
import type { ExportFormat } from "@/hooks/useExport";
import { useExport } from "@/hooks/useExport";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckSquare,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Filter state type ───────────────────────────────────────────────────────

interface FilterState {
  dateFrom: string;
  dateTo: string;
  roomNumber: string;
  searchTerm: string;
  grcNumber: string;
  invoiceNumber: string;
}

const EMPTY_FILTERS: FilterState = {
  dateFrom: "",
  dateTo: "",
  roomNumber: "",
  searchTerm: "",
  grcNumber: "",
  invoiceNumber: "",
};

// Build ExportFilters (optional fields) from FilterState
function buildExportFilters(f: FilterState): ExportFilters {
  const filters: ExportFilters = {};
  // Combine searchTerm with grcNumber / invoiceNumber into a single search
  const term = [f.searchTerm, f.grcNumber, f.invoiceNumber]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  if (term) filters.searchTerm = term;
  if (f.roomNumber.trim()) filters.roomNumber = f.roomNumber.trim();
  if (f.dateFrom) filters.dateFrom = f.dateFrom;
  if (f.dateTo) filters.dateTo = f.dateTo;
  return filters;
}

// ─── Preview table row ───────────────────────────────────────────────────────

function PreviewRow({
  guest,
  checked,
  onToggle,
  index,
}: {
  guest: Guest;
  checked: boolean;
  onToggle: () => void;
  index: number;
}) {
  const formatDate = (d: string, t: string) =>
    d ? `${d}${t ? ` ${t}` : ""}` : "—";
  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="accent-primary w-4 h-4 cursor-pointer"
          data-ocid={`export.row_checkbox.${index}`}
        />
      </td>
      <td className="px-3 py-2.5 text-sm font-medium text-foreground truncate max-w-[150px]">
        {guest.guestName || "—"}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {guest.phoneNumber || "—"}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {guest.roomNumber || "—"}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {formatDate(guest.checkInDate, guest.checkInTime)}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {formatDate(guest.checkOutDate, guest.checkOutTime)}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {guest.grcNumber || "—"}
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground">
        {guest.invoiceNumber || "—"}
      </td>
      <td className="px-3 py-2.5 text-sm font-medium text-foreground text-right">
        {guest.amountPaid ? `₹${guest.amountPaid}` : "—"}
      </td>
    </tr>
  );
}

// ─── Export button component ─────────────────────────────────────────────────

function ExportButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  variant,
  ocid,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled: boolean;
  variant: "primary" | "secondary" | "backup";
  ocid: string;
}) {
  const base =
    "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-smooth disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: `${base} bg-primary text-primary-foreground hover:bg-primary/90`,
    secondary: `${base} bg-card border border-border text-foreground hover:bg-muted`,
    backup: `${base} bg-accent text-accent-foreground hover:bg-accent/90`,
  };
  return (
    <button
      type="button"
      className={styles[variant]}
      onClick={onClick}
      disabled={disabled}
      data-ocid={ocid}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function ExportDataPage() {
  const { actor, isFetching: actorLoading } = useActor(createActor);
  const { isExporting, exportGuests } = useExport();

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<bigint>>(new Set());

  const exportFilters = useMemo(() => buildExportFilters(filters), [filters]);

  // Preview: fetch up to 10 matching guests
  const { data: previewData, isLoading: previewLoading } = useQuery<Guest[]>({
    queryKey: ["export-preview", exportFilters],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.getAllGuestsForExport(exportFilters);
      return all.slice(0, 10);
    },
    enabled: !!actor && !actorLoading,
    staleTime: 10_000,
  });

  // Full filtered count — we use a separate query so the preview is fast
  const { data: allFiltered } = useQuery<Guest[]>({
    queryKey: ["export-all-filtered", exportFilters],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGuestsForExport(exportFilters);
    },
    enabled: !!actor && !actorLoading,
    staleTime: 10_000,
  });

  const previewGuests = previewData ?? [];
  const totalFiltered = allFiltered?.length ?? 0;
  const selectedCount = selectedIds.size;

  // Select All = select all *filtered* guests (not just preview)
  const allFilteredIds = useMemo(
    () => new Set((allFiltered ?? []).map((g) => g.id)),
    [allFiltered],
  );
  const allSelected =
    allFilteredIds.size > 0 &&
    [...allFilteredIds].every((id) => selectedIds.has(id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  }, [allSelected, allFilteredIds]);

  const toggleRow = useCallback((id: bigint) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function setFilter<K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedIds(new Set()); // reset selection when filters change
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setSelectedIds(new Set());
  }

  // ─── Export handlers ─────────────────────────────────────────────────────

  async function handleExport(
    scope: "all" | "filtered" | "selected" | "backup",
    format: ExportFormat,
  ) {
    try {
      let filename: string | null;
      const empty: ExportFilters = {};
      if (scope === "backup") {
        filename = await exportGuests(
          empty,
          format,
          "guests_backup",
          undefined,
        );
      } else if (scope === "all") {
        filename = await exportGuests(empty, format, "guests_all", undefined);
      } else if (scope === "filtered") {
        filename = await exportGuests(
          exportFilters,
          format,
          "guests_filtered",
          undefined,
        );
      } else {
        // selected
        const selectedGuests = (allFiltered ?? []).filter((g) =>
          selectedIds.has(g.id),
        );
        filename = await exportGuests(
          empty,
          format,
          "guests_selected",
          selectedGuests,
        );
      }
      if (filename) {
        toast.success(`Export complete — ${filename} downloaded successfully`);
      }
    } catch {
      toast.error("Export failed. Please try again.");
    }
  }

  const busy = isExporting;

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6" data-ocid="export.page">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <Download className="w-6 h-6 text-primary" />
              Download Guest Data
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Export &amp; Backup
            </p>
          </div>
          {isExporting && (
            <div
              className="flex items-center gap-2 text-muted-foreground text-sm"
              data-ocid="export.loading_state"
            >
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Preparing export…</span>
            </div>
          )}
        </div>

        {/* ── Filters ── */}
        <section
          className="bg-card border border-border rounded-lg p-5"
          data-ocid="export.filters.panel"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Filter Records
            </h2>
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              data-ocid="export.clear_filters.button"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="export-from-date"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                From Date
              </label>
              <input
                id="export-from-date"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter("dateFrom", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-ocid="export.date_from.input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="export-to-date"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                To Date
              </label>
              <input
                id="export-to-date"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter("dateTo", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-ocid="export.date_to.input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="export-room"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Room Number
              </label>
              <input
                id="export-room"
                type="text"
                placeholder="e.g. 101"
                value={filters.roomNumber}
                onChange={(e) => setFilter("roomNumber", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-ocid="export.room_number.input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="export-name"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Guest Name / Phone
              </label>
              <input
                id="export-name"
                type="text"
                placeholder="Search by name or phone"
                value={filters.searchTerm}
                onChange={(e) => setFilter("searchTerm", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-ocid="export.search_term.input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="export-grc"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                GRC Number
              </label>
              <input
                id="export-grc"
                type="text"
                placeholder="e.g. GRC-001"
                value={filters.grcNumber}
                onChange={(e) => setFilter("grcNumber", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-ocid="export.grc_number.input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="export-invoice"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Invoice Number
              </label>
              <input
                id="export-invoice"
                type="text"
                placeholder="e.g. INV-001"
                value={filters.invoiceNumber}
                onChange={(e) => setFilter("invoiceNumber", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-ocid="export.invoice_number.input"
              />
            </div>
          </div>
        </section>

        {/* ── Preview Table ── */}
        <section
          className="bg-card border border-border rounded-lg overflow-hidden"
          data-ocid="export.preview.section"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold text-sm text-foreground">
                Preview (first 10 records)
              </span>
              {allFiltered !== undefined && (
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {totalFiltered} total match
                </span>
              )}
            </div>
            {selectedCount > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs text-primary font-medium"
                data-ocid="export.selected_count"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {selectedCount} of {totalFiltered} guests selected
              </span>
            )}
          </div>

          {previewLoading ? (
            <div
              className="flex items-center justify-center py-16"
              data-ocid="export.preview.loading_state"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading records…
              </span>
            </div>
          ) : previewGuests.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="export.preview.empty_state"
            >
              <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No guests match the current filters.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Adjust filters or clear them to see all records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-ocid="export.preview.table">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-3 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="accent-primary w-4 h-4 cursor-pointer"
                        aria-label="Select all guests"
                        data-ocid="export.select_all.checkbox"
                      />
                    </th>
                    {[
                      "Guest Name",
                      "Phone",
                      "Room No",
                      "Check-in",
                      "Check-out",
                      "GRC No",
                      "Invoice No",
                      "Amount",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewGuests.map((guest, i) => (
                    <PreviewRow
                      key={String(guest.id)}
                      guest={guest}
                      checked={selectedIds.has(guest.id)}
                      onToggle={() => toggleRow(guest.id)}
                      index={i + 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Export Actions ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Download All */}
          <section
            className="bg-card border border-border rounded-lg p-5 space-y-3"
            data-ocid="export.all.section"
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm text-foreground">
                All Records
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Download every guest record in the database (no filters).
            </p>
            <div className="flex flex-col gap-2">
              <ExportButton
                label="Download All (CSV)"
                icon={FileText}
                onClick={() => handleExport("all", "csv")}
                disabled={busy}
                variant="secondary"
                ocid="export.all_csv.button"
              />
              <ExportButton
                label="Download All (Excel)"
                icon={FileSpreadsheet}
                onClick={() => handleExport("all", "xlsx")}
                disabled={busy}
                variant="secondary"
                ocid="export.all_xlsx.button"
              />
            </div>
          </section>

          {/* Download Filtered */}
          <section
            className="bg-card border border-border rounded-lg p-5 space-y-3"
            data-ocid="export.filtered.section"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm text-foreground">
                Filtered Records
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Download only guests matching current filters ({totalFiltered}{" "}
              records).
            </p>
            <div className="flex flex-col gap-2">
              <ExportButton
                label="Download Filtered (CSV)"
                icon={FileText}
                onClick={() => handleExport("filtered", "csv")}
                disabled={busy}
                variant="primary"
                ocid="export.filtered_csv.button"
              />
              <ExportButton
                label="Download Filtered (Excel)"
                icon={FileSpreadsheet}
                onClick={() => handleExport("filtered", "xlsx")}
                disabled={busy}
                variant="primary"
                ocid="export.filtered_xlsx.button"
              />
            </div>
          </section>

          {/* Download Selected */}
          <section
            className="bg-card border border-border rounded-lg p-5 space-y-3"
            data-ocid="export.selected.section"
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm text-foreground">
                Selected Records
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedCount > 0
                ? `${selectedCount} guest${selectedCount === 1 ? "" : "s"} selected.`
                : "Tick checkboxes in the preview to select records."}
            </p>
            <div className="flex flex-col gap-2">
              <ExportButton
                label="Download Selected (CSV)"
                icon={FileText}
                onClick={() => handleExport("selected", "csv")}
                disabled={busy || selectedCount === 0}
                variant="secondary"
                ocid="export.selected_csv.button"
              />
              <ExportButton
                label="Download Selected (Excel)"
                icon={FileSpreadsheet}
                onClick={() => handleExport("selected", "xlsx")}
                disabled={busy || selectedCount === 0}
                variant="secondary"
                ocid="export.selected_xlsx.button"
              />
            </div>
          </section>
        </div>

        {/* ── Full Database Backup ── */}
        <section
          className="bg-primary/5 border border-primary/20 rounded-lg p-5"
          data-ocid="export.backup.section"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base text-foreground">
                  Full Database Backup
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  One-click export of every guest record — no filters.
                  Timestamped filename for safe storage.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <ExportButton
                label="Backup All Data (CSV)"
                icon={Download}
                onClick={() => handleExport("backup", "csv")}
                disabled={busy}
                variant="backup"
                ocid="export.backup_csv.button"
              />
              <ExportButton
                label="Backup All Data (Excel)"
                icon={FileSpreadsheet}
                onClick={() => handleExport("backup", "xlsx")}
                disabled={busy}
                variant="backup"
                ocid="export.backup_xlsx.button"
              />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
