
import { NextResponse } from "next/server";
import { db } from "../../config/database";

type ReminderRow = {
    id: number;
    title: string;
    description: string | null;
    dueAt: string;
    isCompleted: number;
    notifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export async function GET() {
    try {
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
      ORDER BY due_at ASC
    `).all() as ReminderRow[];

        const reminders = rows.map((row) => ({
            ...row,
            isCompleted: row.isCompleted === 1,
        }));

        return NextResponse.json(reminders);
    } catch (error) {
        console.error("GET reminders error:", error);

        return NextResponse.json(
            { error: "Gagal mengambil reminder dari database" },
            { status: 500 }
        );
    }
}

// POST membuat reminder
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, dueAt } = body;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof dueAt !== "string" ||
            !dueAt.trim() ||
            !Number.isFinite(Date.parse(dueAt)) ||
            (description !== undefined &&
                typeof description !== "string")
        ) {
            return NextResponse.json(
                { error: "Data reminder tidak valid" },
                { status: 400 }
            );
        }

        const result = db.prepare(`
      INSERT INTO reminders (
        title,
        description,
        due_at
      )
      VALUES (?, ?, ?)
    `).run(
            title.trim(),
            description ?? null,
            new Date(dueAt).toISOString()
        );

        return NextResponse.json(
            {
                id: Number(result.lastInsertRowid),
                message: "Reminder berhasil dibuat",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST reminders error:", error);

        return NextResponse.json(
            { error: "Gagal menyimpan reminder" },
            { status: 500 }
        );
    }
}
