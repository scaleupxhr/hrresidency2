import { AddGuestPage } from "@/pages/AddGuestPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { EditGuestPage } from "@/pages/EditGuestPage";
import { ExportDataPage } from "@/pages/ExportDataPage";
import { GuestDatabasePage } from "@/pages/GuestDatabasePage";
import { LoginPage } from "@/pages/LoginPage";
import { TrashPage } from "@/pages/TrashPage";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

// Index route (redirect to dashboard)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

// Add guest route
const addGuestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guests/add",
  component: AddGuestPage,
});

// Edit guest route
const editGuestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guests/$id/edit",
  component: EditGuestPage,
});

// Guest database route
const guestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/guests",
  component: GuestDatabasePage,
});

// Trash route
const trashRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trash",
  component: TrashPage,
});

// Export route
const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/export",
  component: ExportDataPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  addGuestRoute,
  editGuestRoute,
  guestsRoute,
  exportRoute,
  trashRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
