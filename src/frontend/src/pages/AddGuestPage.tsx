import { GuestForm } from "@/components/GuestForm";
import { Layout } from "@/components/Layout";
import { UserPlus } from "lucide-react";

export function AddGuestPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Add Guest
            </h1>
            <p className="text-sm text-muted-foreground">
              Register a new guest — all fields are optional
            </p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm"
          data-ocid="add_guest.page"
        >
          <GuestForm mode="add" />
        </div>
      </div>
    </Layout>
  );
}
