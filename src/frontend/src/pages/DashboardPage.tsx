import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDashboardStats,
  useDeleteGuest,
  useRecentGuests,
  useToggleCheckIn,
} from "@/hooks/useGuests";
import type { Guest } from "@/types/guest";
import { useNavigate } from "@tanstack/react-router";
import { format, isValid, parseISO } from "date-fns";
import {
  DoorOpen,
  Edit2,
  LogIn,
  LogOut,
  PlusCircle,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Layout } from "../components/Layout";

// ---- Helpers ----
function safeDate(str: string): string {
  if (!str) return "—";
  const d = parseISO(str);
  return isValid(d) ? format(d, "MMM d, yyyy") : str;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `₹${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

const PAYMENT_COLORS: Record<string, string> = {
  Cash: "var(--primary)",
  UPI: "color-mix(in oklch, var(--primary) 80%, black)",
  Online: "color-mix(in oklch, var(--primary) 60%, white)",
  Card: "color-mix(in oklch, var(--primary) 40%, white)",
  Other: "color-mix(in oklch, var(--primary) 20%, white)",
};

// ---- Stat Card ----
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
  ocid: string;
}

function StatCard({ label, value, icon, loading, ocid }: StatCardProps) {
  return (
    <Card className="border border-border bg-card" data-ocid={ocid}>
      <CardContent className="flex items-center gap-4 p-4 md:p-5">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          {loading ? (
            <>
              <Skeleton className="h-7 w-20 mb-1" />
              <Skeleton className="h-4 w-28" />
            </>
          ) : (
            <>
              <p className="text-2xl font-display font-bold text-foreground leading-tight">
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Delete Confirm Dialog ----
interface DeleteDialogProps {
  guest: Guest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteDialog({ guest, onConfirm, onCancel }: DeleteDialogProps) {
  if (!guest) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-ocid="dashboard.dialog"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Close dialog"
        data-ocid="dashboard.backdrop_button"
      />
      <div className="relative z-10 bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-display font-semibold text-foreground mb-2">
          Delete Guest?
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Move{" "}
          <span className="font-medium text-foreground">
            {guest.guestName || "this guest"}
          </span>{" "}
          to Trash? You can restore them later.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-ocid="dashboard.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            data-ocid="dashboard.confirm_button"
          >
            Move to Trash
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Dashboard ----
export function DashboardPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useDashboardStats();
  const {
    data: guestPage,
    isLoading: guestsLoading,
    isError: guestsError,
  } = useRecentGuests({ fromDate, toDate });

  const toggleMutation = useToggleCheckIn();
  const deleteMutation = useDeleteGuest();

  // Idle detection — pause polling
  const wasHidden = useRef(false);
  useEffect(() => {
    const handler = () => {
      wasHidden.current = document.hidden;
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const guests: Guest[] = guestPage?.guests ?? [];

  // Payment chart data
  const breakdown = stats?.paymentMethodBreakdown;
  const chartData = breakdown
    ? [
        { name: "Cash", value: breakdown.cash },
        { name: "UPI", value: breakdown.upi },
        { name: "Online", value: breakdown.online },
        { name: "Card", value: breakdown.card },
        { name: "Other", value: breakdown.other },
      ].filter((d) => d.value > 0)
    : [];

  const handleToggleCheckIn = (guest: Guest) => {
    const key = guest.id.toString();
    setMutatingIds((prev) => new Set(prev).add(key));
    toggleMutation.mutate(guest.id, {
      onSettled: () => {
        setMutatingIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  };

  return (
    <Layout>
      <div className="space-y-6" data-ocid="dashboard.page">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Welcome back — {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <Button
            type="button"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
            onClick={() => navigate({ to: "/guests/add" })}
            data-ocid="dashboard.add_guest_button"
          >
            <PlusCircle className="w-4 h-4" />
            Add Guest
          </Button>
        </div>

        {/* Date range filter */}
        <div
          className="flex flex-wrap items-center gap-3"
          data-ocid="dashboard.date_filter"
        >
          <label
            className="text-sm font-medium text-muted-foreground"
            htmlFor="from-date"
          >
            From
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            max={toDate || today}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
            data-ocid="dashboard.from_date_input"
          />
          <label
            className="text-sm font-medium text-muted-foreground"
            htmlFor="to-date"
          >
            To
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            min={fromDate}
            max={today}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
            data-ocid="dashboard.to_date_input"
          />
          {(fromDate || toDate) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="text-muted-foreground hover:text-foreground"
              data-ocid="dashboard.clear_filter_button"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Error banners */}
        {statsError && (
          <div
            className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm"
            data-ocid="dashboard.stats_error_state"
          >
            Failed to load dashboard stats. Retrying…
          </div>
        )}
        {guestsError && (
          <div
            className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm"
            data-ocid="dashboard.guests_error_state"
          >
            Failed to load recent guests. Retrying…
          </div>
        )}

        {/* Stats cards — 2×2 on mobile, 4 cols on desktop */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
          data-ocid="dashboard.stats_section"
        >
          <StatCard
            label="Total Guests"
            value={
              statsLoading
                ? "—"
                : Number(stats?.totalGuests ?? 0).toLocaleString()
            }
            icon={<Users className="w-5 h-5" />}
            loading={statsLoading}
            ocid="dashboard.total_guests_card"
          />
          <StatCard
            label="Today's Check-ins"
            value={
              statsLoading
                ? "—"
                : Number(stats?.todayCheckIns ?? 0).toLocaleString()
            }
            icon={<LogIn className="w-5 h-5" />}
            loading={statsLoading}
            ocid="dashboard.checkins_card"
          />
          <StatCard
            label="Today's Check-outs"
            value={
              statsLoading
                ? "—"
                : Number(stats?.todayCheckOuts ?? 0).toLocaleString()
            }
            icon={<LogOut className="w-5 h-5" />}
            loading={statsLoading}
            ocid="dashboard.checkouts_card"
          />
          <StatCard
            label="Total Revenue"
            value={
              statsLoading ? "—" : formatCurrency(stats?.totalRevenue ?? 0)
            }
            icon={<TrendingUp className="w-5 h-5" />}
            loading={statsLoading}
            ocid="dashboard.revenue_card"
          />
        </div>

        {/* Chart + Quick actions row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Payment chart */}
          <Card
            className="lg:col-span-2 border border-border bg-card"
            data-ocid="dashboard.payment_chart"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Payment Method Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : chartData.length === 0 ? (
                <div
                  className="h-48 flex items-center justify-center text-muted-foreground text-sm"
                  data-ocid="dashboard.chart_empty_state"
                >
                  No payment data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(val: number) => [
                        `₹${val.toLocaleString()}`,
                        "Amount",
                      ]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PAYMENT_COLORS[entry.name] ?? "#DC2626"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Quick info panel */}
          <Card
            className="border border-border bg-card"
            data-ocid="dashboard.quick_panel"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
                onClick={() => navigate({ to: "/guests/add" })}
                data-ocid="dashboard.quick_add_guest_button"
              >
                <PlusCircle className="w-4 h-4" />
                Add New Guest
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate({ to: "/guests" })}
                data-ocid="dashboard.view_all_guests_button"
              >
                <Users className="w-4 h-4" />
                View All Guests
              </Button>
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Payment Summary
                </p>
                {statsLoading ? (
                  <div className="space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {chartData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0 bg-primary opacity-[var(--dot-opacity,1)]"
                            data-payment={item.name}
                            style={
                              item.name !== "Cash"
                                ? { background: PAYMENT_COLORS[item.name] }
                                : undefined
                            }
                          />
                          <span className="text-muted-foreground">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">
                          ₹{item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {chartData.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No payments recorded yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Guests Table */}
        <Card
          className="border border-border bg-card"
          data-ocid="dashboard.recent_guests_section"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Recent Guests
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 text-xs"
              onClick={() => navigate({ to: "/guests" })}
              data-ocid="dashboard.view_all_link"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                      Name
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                      Room
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                      Check-in
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">
                      Check-out
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">
                      Amount
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2.5">
                      Status
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2.5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {guestsLoading ? (
                    ["r1", "r2", "r3", "r4", "r5"].map((rk) => (
                      <tr
                        key={rk}
                        className="border-b border-border last:border-0"
                      >
                        {["c1", "c2", "c3", "c4", "c5", "c6", "c7"].map(
                          (ck) => (
                            <td key={ck} className="px-4 py-3">
                              <Skeleton className="h-4 w-full" />
                            </td>
                          ),
                        )}
                      </tr>
                    ))
                  ) : guests.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div
                          className="flex flex-col items-center justify-center py-12 text-center"
                          data-ocid="dashboard.guests_empty_state"
                        >
                          <DoorOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
                          <p className="text-sm font-medium text-muted-foreground">
                            No guests found
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Add your first guest to get started
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            className="mt-4 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => navigate({ to: "/guests/add" })}
                            data-ocid="dashboard.empty_add_guest_button"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Add Guest
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    guests.map((guest, idx) => {
                      const isMutating = mutatingIds.has(guest.id.toString());
                      return (
                        <tr
                          key={guest.id.toString()}
                          className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                          data-ocid={`dashboard.guest_row.item.${idx + 1}`}
                        >
                          <td className="px-4 py-3 font-medium text-foreground max-w-[140px]">
                            <span className="truncate block">
                              {guest.guestName || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {guest.roomNumber ? `Rm ${guest.roomNumber}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {safeDate(guest.checkInDate)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {safeDate(guest.checkOutDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">
                            {guest.amountPaid > 0
                              ? `₹${guest.amountPaid.toLocaleString()}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant={
                                guest.checkedIn ? "default" : "secondary"
                              }
                              className={
                                guest.checkedIn
                                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {guest.checkedIn ? "Checked In" : "Checked Out"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Check-in toggle */}
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  guest.checkedIn ? "destructive" : "default"
                                }
                                className={`h-7 px-2 text-xs gap-1 transition-smooth ${
                                  guest.checkedIn
                                    ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                                }`}
                                onClick={() => handleToggleCheckIn(guest)}
                                disabled={isMutating}
                                aria-label={
                                  guest.checkedIn
                                    ? "Check out guest"
                                    : "Check in guest"
                                }
                                data-ocid={`dashboard.toggle_checkin.${idx + 1}`}
                              >
                                {isMutating ? (
                                  <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : guest.checkedIn ? (
                                  <>
                                    <LogOut className="w-3 h-3" />
                                    Out
                                  </>
                                ) : (
                                  <>
                                    <LogIn className="w-3 h-3" />
                                    In
                                  </>
                                )}
                              </Button>
                              {/* Edit */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  navigate({
                                    to: `/guests/${guest.id.toString()}/edit`,
                                  })
                                }
                                aria-label="Edit guest"
                                data-ocid={`dashboard.edit_button.${idx + 1}`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              {/* Delete */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/50"
                                onClick={() => setDeleteTarget(guest)}
                                aria-label="Delete guest"
                                data-ocid={`dashboard.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        guest={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
