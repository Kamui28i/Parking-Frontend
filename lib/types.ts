export type Role = "CITIZEN" | "ADMIN";

export type SpaceStatus = "FREE" | "RESERVED" | "OCCUPIED";
export type ReservationStatus = "ACTIVE" | "CONFIRMED" | "PENDING" | "CANCELLED";
export type InvoiceStatus = "PAID" | "PENDING" | "FAILED";
export type SpaceType = "REGULAR" | "EV";

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  status: SpaceStatus;
  zoneId: string;
}

export interface Zone {
  id: string;
  name: string;
  address: string;
  capacity: number;
  available: number;
  occupancy: number;
  spaces: Space[];
}

export interface Reservation {
  id: string;
  spaceId: string;
  spaceName: string;
  zoneName: string;
  start: string;
  end: string;
  fee: string;
  status: ReservationStatus;
  evCharging: boolean;
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
  zone: string;
  spaceType: SpaceType;
  basePrice: string;
  validFrom: string;
  validTo: string | null;
  active: boolean;
}
