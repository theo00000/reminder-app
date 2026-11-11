
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const globalForDb = globalThis as unknown as {
    reminderDb?: Database.Database;
};

function initializeDatabase(): Database.Database {
    const dataDir = path.join(process.cwd(), "data");

    mkdirSync(dataDir, { recursive: true });

    // Database baru, database lama tetap aman
    const dbPath = path.join(
        dataDir,
        "reminders-v2.sqlite"
    );

    const db = new Database(dbPath);

    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");
    db.pragma("foreign_keys = ON");

    db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      due_at TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      notified_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_due
    ON reminders(due_at);
  `);

    console.log("SQLite initialized:", dbPath);

    return db;
}

export const db =
    globalForDb.reminderDb ?? initializeDatabase();

if (process.env.NODE_ENV !== "production") {
    globalForDb.reminderDb = db;
}
