import { api } from "../utils/axios-client";
import type { AppNotification } from "../types/notification.type";

export class NotificationApi {
    static async getAllNotifications(): Promise<AppNotification[]> {
        const { data } = await api.get("notifications");
        return data;
    }

    static async markAsRead(notificationId: number): Promise<AppNotification> {
        const {data} = await api.patch(`notifications/${notificationId}/read`);
        return data;
    }
}