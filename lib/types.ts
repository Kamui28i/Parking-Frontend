export type Role = "CITIZEN" | "ADMIN";

export type SpaceState = "FREE" | "RESERVED" | "OCCUPIED";
export type SpaceType = "REGULAR" | "EV";
export type PricingSpaceType = "REGULAR" | "EV" | "ALL";
export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type InvoiceStatus = "PAID" | "PENDING" | "FAILED";
export type ChargingStatus = "PENDING" | "ACTIVE" | "COMPLETED";

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface Space {
  id: string;
  zoneId: string;
  name: string;
  type: SpaceType;
  state: SpaceState;
}

export interface Zone {
  id: string;
  name: string;
  address: string;
  totalCapacity: number; // derived: number of spaces (from backend)
  availableCount: number;
  latitude?: number | null;
  longitude?: number | null;
  boundary?: string | null;
  spaces?: Space[];
}

export interface Reservation {
  id: string;
  spaceId: string;
  spaceName?: string;
  zoneName?: string;
  citizenId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedFee: string;
  withCharging: boolean;
  status: ReservationStatus;
  licensePlate?: string;
}

export type InvoiceType = "RESERVATION" | "CHARGING";

export interface Invoice {
  id: string;
  reservationId: string;
  spaceName?: string;
  zoneName?: string;
  amount: string;
  status: InvoiceStatus;
  invoiceType: InvoiceType;
  createdAt: string;
}

export interface ChargingSession {
  id: string;
  reservationId: string;
  spaceId: string;
  spaceName?: string;
  zoneName?: string;
  status: ChargingStatus;
  startedAt: string;
  energyKwh: number | null;
  licensePlate?: string;
}

export interface PricingRule {
  id: string;
  zoneId: string;
  spaceType: PricingSpaceType;
  ratePerHour: string;
  validFrom: string;
  validTo: string | null;
}
