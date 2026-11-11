import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const globalForDb = globalThis as unknown as {
    reminderDb?: Database.Database;
};

function initializeDatabase(): Database.Database {
    const dataDir = path.join(process.cwd(), "data");

    mkdirSync(dataDir, { recursive: true });

    const db = new Database(
        path.join(dataDir, "reminders.sqlite")
    );

    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");

    db.exec(`
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            dueDate TEXT NOT NULL,
            isCompleted INTEGER NOT NULL DEFAULT 0,
            notificationSent INTEGER NOT NULL DEFAULT 0
        );

    `);
    return db;
}

export const db =
    globalForDb.reminderDb ?? initializeDatabase();

if (process.env.NODE_ENV !== "production") {
    globalForDb.reminderDb = db;
}