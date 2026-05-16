import { api } from "./base";

export type NotificationType =
  | "JOB_POSTED"
  | "VERIFICATION_RESULT"
  | "APPLICATION_UPDATE"
  | "EVENT_CREATED"
  | "ACCOUNT_STATUS"
  | "ALUMNI_POST"
  | "PENDING_VERIFICATION"
  | "NEW_REGISTRATION"
  | "ALUMNI_INVITE";

export interface NotificationItem {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export const listNotifications = async (
  opts: { limit?: number; unreadOnly?: boolean } = {}
): Promise<NotificationsResponse> => {
  const { data } = await api.get<NotificationsResponse>("/notifications", {
    params: {
      ...(opts.limit ? { limit: opts.limit } : {}),
      ...(opts.unreadOnly ? { unreadOnly: true } : {}),
    },
  });
  return data;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await api.get<{ unreadCount: number }>(
    "/notifications/unread-count"
  );
  return data.unreadCount;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.post(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.post("/notifications/read-all");
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};
