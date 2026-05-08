import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Download,
  LayoutDashboard,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Add Guest", href: "/guests/add", icon: UserPlus },
  { label: "Guest Database", href: "/guests", icon: Users },
  { label: "Export Data", href: "/export", icon: Download },
  { label: "Trash", href: "/trash", icon: Trash2 },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden w-full h-full cursor-default"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-card border-r border-border flex flex-col transition-smooth",
          "lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main navigation"
      >
        {/* Sidebar header — only shown on mobile to allow close */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border lg:hidden">
          <span className="font-display font-bold text-foreground text-lg">
            Navigation
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            data-ocid="sidebar.close_button"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Hotel branding strip at top of sidebar (desktop) */}
        <div className="hidden lg:flex items-center px-6 py-5 border-b border-border">
          <span className="font-display font-bold text-xl">
            <span className="text-primary">HR</span>
            <span className="text-foreground"> Residency 2</span>
          </span>
        </div>

        {/* Nav items */}
        <nav
          className="flex-1 py-4 overflow-y-auto"
          aria-label="Sidebar navigation"
        >
          <ul className="space-y-0.5 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? currentPath === "/" || currentPath.startsWith("/dashboard")
                  : currentPath.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    data-ocid={`nav.${item.label.toLowerCase().replace(/ /g, "_")}.link`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm font-medium transition-smooth",
                      isActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom decorative strip */}
        <div className="px-6 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            HR Residency 2 &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  );
}
