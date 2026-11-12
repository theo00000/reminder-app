
import { getDb } from "../config/database";
import type { Reminder } from "../models/Reminder";
import { NotificationEngine } from "./NotificationEngine";

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
            // Inisialisasi koneksi Turso
            const db = getDb();
            const now = new Date().toISOString();

            // Ambil reminder yang sudah jatuh tempo
            const result = await db.execute({
                sql: `
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
        `,
                args: [now],
            });

            // Mapping data Turso ke model Reminder
            const reminders: Reminder[] = result.rows.map((row) => ({
                id: Number(row.id),
                title: String(row.title),
                description:
                    row.description == null
                        ? null
                        : String(row.description),
                dueAt: String(row.dueAt),
                isCompleted: Number(row.isCompleted) === 1,
                notifiedAt:
                    row.notifiedAt == null
                        ? null
                        : String(row.notifiedAt),
                createdAt: String(row.createdAt),
                updatedAt: String(row.updatedAt),
            }));

            // Proses reminder yang jatuh tempo
            for (const reminder of reminders) {
                try {
                    await NotificationEngine.triggerAlert(reminder);

                    const notifiedAt = new Date().toISOString();

                    await db.execute({
                        sql: `
              UPDATE reminders
              SET
                notified_at = ?,
                updated_at = ?
              WHERE id = ?
                AND notified_at IS NULL
                AND is_completed = 0
            `,
                        args: [
                            notifiedAt,
                            notifiedAt,
                            reminder.id,
                        ],
                    });
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
