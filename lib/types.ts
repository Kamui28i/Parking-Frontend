export type Role = "CITIZEN" | "ADMIN";

export type SpaceState = "FREE" | "RESERVED" | "OCCUPIED";
export type SpaceType = "REGULAR" | "EV";
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
  totalCapacity: number;
  availableCount: number;
  latitude?: number | null;
  longitude?: number | null;
  boundary?: string | null;
  spaces?: Space[];
}

export interface Reservation {
  id: string;
  spaceId: string;
  citizenId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedFee: string;
  withCharging: boolean;
  status: ReservationStatus;
}

export interface Invoice {
  id: string;
  reservationId: string;
  amount: string;
  status: InvoiceStatus;
  createdAt: string;
}

export interface PricingRule {
  id: string;
  zoneId: string;
  spaceType: SpaceType;
  ratePerHour: string;
  validFrom: string;
  validTo: string | null;
}
