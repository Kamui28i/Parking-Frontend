const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error ?? error.message ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
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
  spaces: (zoneId: string) => request<import("./types").Space[]>(`/zones/${zoneId}/spaces`),
  create: (data: { name: string; address: string; totalCapacity: number }) =>
    request<import("./types").Zone>("/zones", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name: string; address: string; totalCapacity: number }) =>
    request<import("./types").Zone>(`/zones/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/zones/${id}`, { method: "DELETE" }),
  addSpace: (zoneId: string, data: { type: import("./types").SpaceType }) =>
    request<import("./types").Space>(`/zones/${zoneId}/spaces`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSpace: (
    zoneId: string,
    spaceId: string,
    data: { type: import("./types").SpaceType; state: import("./types").SpaceState }
  ) =>
    request<import("./types").Space>(`/zones/${zoneId}/spaces/${spaceId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Reservations
export const reservationsApi = {
  list: () => request<import("./types").Reservation[]>("/reservations/my"),
  get: (id: string) => request<import("./types").Reservation>(`/reservations/${id}`),
  create: (data: {
    spaceId: string;
    startTime: string;
    endTime: string;
    withCharging: boolean;
  }) =>
    request<import("./types").Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cancel: (id: string) => request<void>(`/reservations/${id}`, { method: "DELETE" }),
  startCharging: (reservationId: string) =>
    request<void>("/charging/sessions/start", {
      method: "POST",
      body: JSON.stringify({ reservationId }),
    }),
};

// Invoices
export const invoicesApi = {
  list: () => request<import("./types").Invoice[]>("/invoices/my"),
  get: (id: string) => request<import("./types").Invoice>(`/invoices/${id}`),
  listAll: () => request<import("./types").Invoice[]>("/invoices"),
};

// Pricing
export const pricingApi = {
  list: () => request<import("./types").PricingRule[]>("/pricing/rules"),
  create: (data: Partial<import("./types").PricingRule>) =>
    request<import("./types").PricingRule>("/pricing/rules", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<import("./types").PricingRule>) =>
    request<import("./types").PricingRule>(`/pricing/rules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<void>(`/pricing/rules/${id}`, { method: "DELETE" }),
};
