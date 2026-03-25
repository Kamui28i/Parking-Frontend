/**
 * API client stubs — replace BASE_URL and implement auth headers
 * when integrating with the backend.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "Request failed");
  }
  return res.json();
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: import("./types").User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, role: import("./types").Role) =>
    request<{ token: string; user: import("./types").User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),
};

// Zones & Spaces
export const zonesApi = {
  list: () => request<import("./types").Zone[]>("/zones"),
  get: (id: string) => request<import("./types").Zone>(`/zones/${id}`),
  create: (data: Partial<import("./types").Zone>) =>
    request<import("./types").Zone>("/zones", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<import("./types").Zone>) =>
    request<import("./types").Zone>(`/zones/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/zones/${id}`, { method: "DELETE" }),
  addSpace: (zoneId: string, data: Partial<import("./types").Space>) =>
    request<import("./types").Space>(`/zones/${zoneId}/spaces`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSpace: (zoneId: string, spaceId: string, data: Partial<import("./types").Space>) =>
    request<import("./types").Space>(`/zones/${zoneId}/spaces/${spaceId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Reservations
export const reservationsApi = {
  list: (filter?: "ACTIVE" | "PAST") =>
    request<import("./types").Reservation[]>(
      `/reservations${filter ? `?status=${filter}` : ""}`
    ),
  get: (id: string) => request<import("./types").Reservation>(`/reservations/${id}`),
  create: (data: {
    spaceId: string;
    start: string;
    end: string;
    evCharging: boolean;
  }) =>
    request<import("./types").Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cancel: (id: string) =>
    request<import("./types").Reservation>(`/reservations/${id}/cancel`, { method: "POST" }),
  startCharging: (id: string) =>
    request<void>(`/reservations/${id}/charging/start`, { method: "POST" }),
};

// Invoices
export const invoicesApi = {
  list: () => request<import("./types").Invoice[]>("/invoices"),
  get: (id: string) => request<import("./types").Invoice>(`/invoices/${id}`),
  listAll: () => request<import("./types").Invoice[]>("/admin/invoices"),
};

// Pricing
export const pricingApi = {
  list: () => request<import("./types").PricingRule[]>("/admin/pricing"),
  create: (data: Partial<import("./types").PricingRule>) =>
    request<import("./types").PricingRule>("/admin/pricing", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<import("./types").PricingRule>) =>
    request<import("./types").PricingRule>(`/admin/pricing/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/admin/pricing/${id}`, { method: "DELETE" }),
};
