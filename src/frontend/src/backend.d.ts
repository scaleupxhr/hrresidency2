import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Guest {
    id: GuestId;
    isDeleted: boolean;
    paymentMethod: PaymentMethod;
    grcNumber: string;
    createdAt: Time;
    checkInDate: string;
    guestName: string;
    checkInTime: string;
    roomNumber: string;
    amountPaid: number;
    updatedAt: Time;
    invoiceNumber: string;
    address: string;
    notes: string;
    checkedIn: boolean;
    checkOutDate: string;
    idProofType: string;
    checkOutTime: string;
    phoneNumber: string;
    purposeOfVisit: string;
    roomType: string;
    idProofNumber: string;
    numberOfGuests: bigint;
    idProofImageUrl: Array<string>;
}
export interface PaymentBreakdown {
    upi: number;
    other: number;
    card: number;
    cash: number;
    online: number;
}
export type GuestId = bigint;
export interface GuestPage {
    total: bigint;
    page: bigint;
    totalPages: bigint;
    guests: Array<Guest>;
}
export interface SearchParams {
    page: bigint;
    includeDeleted: boolean;
    limit: bigint;
    toDate?: string;
    searchTerm?: string;
    fromDate?: string;
}
export interface GuestInput {
    paymentMethod: PaymentMethod;
    grcNumber: string;
    checkInDate: string;
    guestName: string;
    checkInTime: string;
    roomNumber: string;
    amountPaid: number;
    invoiceNumber: string;
    address: string;
    notes: string;
    checkOutDate: string;
    idProofType: string;
    checkOutTime: string;
    phoneNumber: string;
    purposeOfVisit: string;
    roomType: string;
    idProofNumber: string;
    numberOfGuests: bigint;
    idProofImageUrl: Array<string>;
}
export interface ExportFilters {
    dateTo?: string;
    roomNumber?: string;
    searchTerm?: string;
    dateFrom?: string;
}
export interface DashboardStats {
    todayCheckOuts: bigint;
    todayCheckIns: bigint;
    totalGuests: bigint;
    totalRevenue: number;
    paymentMethodBreakdown: PaymentBreakdown;
}
export enum PaymentMethod {
    UPI = "UPI",
    Card = "Card",
    Cash = "Cash",
    Online = "Online",
    Other = "Other"
}
export interface backendInterface {
    addGuest(input: GuestInput): Promise<Guest>;
    deleteGuest(id: GuestId): Promise<boolean>;
    getAllGuestsForExport(filters: ExportFilters): Promise<Array<Guest>>;
    getDashboardStats(): Promise<DashboardStats>;
    getGuest(id: GuestId): Promise<Guest | null>;
    getGuests(params: SearchParams): Promise<GuestPage>;
    hardDeleteGuest(id: GuestId): Promise<boolean>;
    restoreGuest(id: GuestId): Promise<boolean>;
    toggleGuestCheckIn(id: GuestId): Promise<boolean | null>;
    updateGuest(id: GuestId, input: GuestInput): Promise<boolean>;
}
