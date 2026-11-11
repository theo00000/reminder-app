
import { NextResponse } from "next/server";
import { db } from "../../config/database";

export const runtime = "nodejs";

export async function GET() {
    const reminders = db.prepare(`
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
    ORDER BY due_at ASC
  `).all();

    return NextResponse.json(
        reminders.map((item) => {
            const row = item as Record<string, unknown>;

            return {
                ...row,
                isCompleted: Boolean(row.isCompleted),
            };
        })
    );
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, dueAt } = body;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof dueAt !== "string" ||
            !dueAt.trim() ||
            !Number.isFinite(Date.parse(dueAt))
        ) {
            return NextResponse.json(
                { error: "Title atau tanggal tidak valid" },
                { status: 400 }
            );
        }

        const result = db.prepare(`
      INSERT INTO reminders (
        title, description, due_at
      ) VALUES (?, ?, ?)
    `).run(
            title.trim(),
            typeof description === "string"
                ? description
                : null,
            new Date(dueAt).toISOString()
        );

        return NextResponse.json(
            {
                id: Number(result.lastInsertRowid),
                message: "Reminder berhasil dibuat",
            },
            { status: 201 }
        );
    } catch {
        return NextResponse.json(
            { error: "Gagal memproses permintaan" },
            { status: 400 }
        );
    }
}
