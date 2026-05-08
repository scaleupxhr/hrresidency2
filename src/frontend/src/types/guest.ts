export type {
  Guest,
  GuestId,
  GuestInput,
  GuestPage,
  SearchParams,
  DashboardStats,
  PaymentBreakdown,
} from "@/backend";
export { PaymentMethod } from "@/backend";

export interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
}

export const ADMIN_CREDENTIALS = {
  email: "scaleupxhr2@gmail.com",
  password: "2owner123",
} as const;

export const AUTH_KEY = "hr_residency_2_auth";
