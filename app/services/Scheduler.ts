
import { db } from "../config/database";
import type { Reminder } from "../models/Reminder";
import { NotificationEngine } from "./NotificationEngine";

type ReminderRow = Omit<Reminder, "isCompleted"> & {
    isCompleted: number;
};

export class ReminderScheduler {
    private checkInterval: ReturnType<typeof setInterval> | null = null;
    private isChecking = false;

    public startDaemon(): void {
        if (this.checkInterval) return;

        void this.checkDueReminders();

        this.checkInterval = setInterval(() => {
            void this.checkDueReminders();
        }, 60_000);
    }

    private async checkDueReminders(): Promise<void> {
        if (this.isChecking) return;

        this.isChecking = true;

        try {
            const now = new Date().toISOString();

            const rows = db.prepare(`
        SELECT
          id,
          title,
          description,
          due_at AS dueAt,
          is_completed AS isCompleted,
          notified_at AS notifiedAt,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM reminders
        WHERE is_completed = 0
          AND notified_at IS NULL
          AND due_at <= ?
        ORDER BY due_at ASC
      `).all(now) as ReminderRow[];

            for (const row of rows) {
                const reminder: Reminder = {
                    ...row,
                    isCompleted: row.isCompleted === 1,
                };

                try {
                    await NotificationEngine.triggerAlert(reminder);

                    const notifiedAt = new Date().toISOString();

                    db.prepare(`
            UPDATE reminders
            SET notified_at = ?,
                updated_at = ?
            WHERE id = ?
              AND notified_at IS NULL
              AND is_completed = 0
          `).run(
                        notifiedAt,
                        notifiedAt,
                        reminder.id
                    );
                } catch (error) {
                    console.error(
                        `Notification failed for reminder ${reminder.id}:`,
                        error
                    );
                }
            }
        } catch (error) {
            console.error("Scheduler error:", error);
        } finally {
            this.isChecking = false;
        }
    }

    public stopDaemon(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}
