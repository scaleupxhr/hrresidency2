import type { backendInterface } from "../backend";
import { PaymentMethod } from "../backend";

const sampleGuests = [
  {
    id: BigInt(1),
    isDeleted: false,
    guestName: "Rajesh Kumar",
    phoneNumber: "+91 98765 43210",
    address: "12 MG Road, Bangalore",
    idProofType: "Aadhaar",
    idProofNumber: "1234-5678-9012",
    idProofImageUrl: [],
    checkInDate: "2026-05-05",
    checkInTime: "02:00 PM",
    checkOutDate: "2026-05-08",
    checkOutTime: "11:00 AM",
    roomNumber: "101",
    roomType: "Deluxe",
    numberOfGuests: BigInt(2),
    purposeOfVisit: "Business",
    grcNumber: "GRC-001",
    invoiceNumber: "INV-2026-001",
    amountPaid: 15000,
    paymentMethod: PaymentMethod.UPI,
    notes: "Early check-in requested",
    checkedIn: true,
    createdAt: BigInt(Date.now() * 1_000_000),
    updatedAt: BigInt(Date.now() * 1_000_000),
  },
  {
    id: BigInt(2),
    isDeleted: false,
    guestName: "Priya Sharma",
    phoneNumber: "+91 87654 32109",
    address: "45 Park Street, Mumbai",
    idProofType: "Passport",
    idProofNumber: "J1234567",
    idProofImageUrl: [],
    checkInDate: "2026-05-06",
    checkInTime: "03:00 PM",
    checkOutDate: "2026-05-09",
    checkOutTime: "10:00 AM",
    roomNumber: "205",
    roomType: "Suite",
    numberOfGuests: BigInt(1),
    purposeOfVisit: "Leisure",
    grcNumber: "GRC-002",
    invoiceNumber: "INV-2026-002",
    amountPaid: 25000,
    paymentMethod: PaymentMethod.Card,
    notes: "Anniversary stay",
    checkedIn: true,
    createdAt: BigInt(Date.now() * 1_000_000),
    updatedAt: BigInt(Date.now() * 1_000_000),
  },
  {
    id: BigInt(3),
    isDeleted: false,
    guestName: "Amit Patel",
    phoneNumber: "+91 76543 21098",
    address: "78 Ring Road, Delhi",
    idProofType: "Voter ID",
    idProofNumber: "DL/01/001/234567",
    idProofImageUrl: [],
    checkInDate: "2026-05-07",
    checkInTime: "12:00 PM",
    checkOutDate: "2026-05-10",
    checkOutTime: "12:00 PM",
    roomNumber: "312",
    roomType: "Standard",
    numberOfGuests: BigInt(3),
    purposeOfVisit: "Family Vacation",
    grcNumber: "GRC-003",
    invoiceNumber: "INV-2026-003",
    amountPaid: 9000,
    paymentMethod: PaymentMethod.Cash,
    notes: "",
    checkedIn: false,
    createdAt: BigInt(Date.now() * 1_000_000),
    updatedAt: BigInt(Date.now() * 1_000_000),
  },
];

export const mockBackend: backendInterface = {
  getDashboardStats: async () => ({
    totalGuests: BigInt(42),
    todayCheckIns: BigInt(5),
    todayCheckOuts: BigInt(3),
    totalRevenue: 385000,
    paymentMethodBreakdown: {
      cash: 120000,
      upi: 145000,
      card: 85000,
      online: 25000,
      other: 10000,
    },
  }),

  getGuests: async (params) => ({
    guests: params.includeDeleted
      ? sampleGuests.filter((g) => g.isDeleted)
      : sampleGuests.filter((g) => !g.isDeleted),
    total: BigInt(3),
    page: params.page,
    totalPages: BigInt(1),
  }),

  getGuest: async (id) => sampleGuests.find((g) => g.id === id) ?? null,

  addGuest: async (input) => ({
    id: BigInt(4),
    isDeleted: false,
    ...input,
    checkedIn: false,
    createdAt: BigInt(Date.now() * 1_000_000),
    updatedAt: BigInt(Date.now() * 1_000_000),
  }),

  updateGuest: async () => true,

  deleteGuest: async () => true,

  hardDeleteGuest: async () => true,

  restoreGuest: async () => true,

  toggleGuestCheckIn: async () => true,

  getAllGuestsForExport: async () => sampleGuests.filter((g) => !g.isDeleted),
};
