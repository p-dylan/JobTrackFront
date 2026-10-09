// src/constants/notification.ts
// Libellés + icônes des notifications (GET notifications) pour "Derniers événements".
import {
  Bell,
  Calendar,
  CheckCircle2,
  Inbox,
  MessageCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { NotificationEventType } from "../types/notification.type";

export const NOTIFICATION_EVENT: Record<NotificationEventType, { text: string; icon: LucideIcon }> = {
  NEW_APPLICATION: { text: "Nouvelle candidature reçue", icon: Inbox },
  APPLICATION_ACCEPTED: { text: "Candidature acceptée", icon: CheckCircle2 },
  APPLICATION_REJECTED: { text: "Candidature refusée", icon: XCircle },
  NEW_MESSAGE: { text: "Nouveau message", icon: MessageCircle },
  INTERVIEW_INVITATION: { text: "Invitation à un entretien", icon: Calendar },
  INTERVIEW_REMINDER: { text: "Rappel d'entretien", icon: Bell },
};
