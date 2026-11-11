import { Reminder } from '../models/Reminder';
import { NotificationEngine } from './NotificationEngine';

export class ReminderScheduler {
    private activeReminders: Reminder[] = [];
    private checkInterval: NodeJS.Timeout | null = null;

    constructor(initialReminders: Reminder[] = []) {
        this.activeReminders = initialReminders;
    }

    public addReminder(reminder: Reminder): void {
        this.activeReminders.push(reminder);
    }

    public startDaemon(): void {
        if (this.checkInterval) return;

        this.checkInterval = setInterval(() => {
            const now = new Date();

            this.activeReminders.forEach((reminder) => {
                if (
                    !reminder.isCompleted &&
                    !reminder.notificationSent &&
                    new Date(reminder.dueDate) <= now
                ) {
                    NotificationEngine.triggerAlert(reminder);
                    reminder.notificationSent = true;
                }
            });
        }, 60000);
    }

    public stopDaemon(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

