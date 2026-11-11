import { Reminder } from '../models/Reminder';

export class NotificationEngine {
    public static triggerAlert(reminder: Reminder): void {
        console.log(`[ALERT ENGINE] Broadcast sent: ${reminder.title}`);

        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(`⏰ Reminder: ${reminder.title}`, {
                    body: reminder.description || 'Your scheduled action is due now.',
                });
            }
        }
    }
}