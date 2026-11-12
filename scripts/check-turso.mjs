
import { createClient } from "@libsql/client/web";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    throw new Error("Turso credentials missing");
}

const db = createClient({ url, authToken });

try {
    console.log("Database host:", new URL(url).host);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      due_at TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      notified_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

    await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_reminders_due
    ON reminders(due_at)
  `);

    const result = await db.execute(
        "PRAGMA table_info(reminders)"
    );

    console.table(
        result.rows.map((row) => ({
            column: row.name,
            type: row.type,
        }))
    );

    console.log("Database initialization completed!");
} catch (error) {
    console.error("Initialization failed:", error);
    process.exitCode = 1;
} finally {
    db.close();
}
