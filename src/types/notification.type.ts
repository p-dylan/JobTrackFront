export type NotificationEventType= "NEW_APPLICATION" | "APPLICATION_ACCEPTED" | "APPLICATION_REJECTED" | "NEW_MESSAGE" | "INTERVIEW_INVITATION" | "INTERVIEW_REMINDER" | "CONNECTION_REQUEST" | "CONNECTION_ACCEPTED";

export type AppNotification = {
    id: number;
    target_user_id: number;
    trigger_id: number;
    source_id: number | null;
    event_type: NotificationEventType;
    is_read: boolean;
    created_at: string;
}
    
  
 
  
  
  

