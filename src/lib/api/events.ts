import { api } from "./base";

export type EventType =
  | "PLACEMENT_DRIVE"
  | "WORKSHOP"
  | "SEMINAR"
  | "MOCK_INTERVIEW"
  | "WEBINAR"
  | "OTHER";

export type EventStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  location: string | null;
  type: EventType;
  status: EventStatus;
  createdById?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  type: EventType;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  status?: EventStatus;
}

// Admin
export const adminListEvents = async (
  scope?: "upcoming" | "past"
): Promise<EventItem[]> => {
  const { data } = await api.get<{ items: EventItem[] }>("/admin/events", {
    params: scope ? { scope } : {},
  });
  return data.items;
};

export const adminCreateEvent = async (
  payload: CreateEventPayload
): Promise<EventItem> => {
  const { data } = await api.post<{ event: EventItem }>(
    "/admin/events",
    payload
  );
  return data.event;
};

export const adminUpdateEvent = async (
  id: string,
  payload: UpdateEventPayload
): Promise<EventItem> => {
  const { data } = await api.patch<{ event: EventItem }>(
    `/admin/events/${id}`,
    payload
  );
  return data.event;
};

export const adminCancelEvent = async (id: string): Promise<EventItem> => {
  const { data } = await api.post<{ event: EventItem }>(
    `/admin/events/${id}/cancel`
  );
  return data.event;
};

export const adminDeleteEvent = async (id: string): Promise<void> => {
  await api.delete(`/admin/events/${id}`);
};

// Public
export const publicListUpcomingEvents = async (): Promise<EventItem[]> => {
  const { data } = await api.get<{ items: EventItem[] }>("/public/events");
  return data.items;
};
