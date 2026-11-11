
import { NextResponse } from "next/server";
import { db } from "../../../config/database";

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

// GET - Mengambil semua reminder
export async function GET() {
    try {
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
    `).all() as ReminderRow[];

        const result = reminders.map((item) => ({
            ...item,
            isCompleted: item.isCompleted === 1,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error("GET reminders error:", error);

        return NextResponse.json(
            { error: "Gagal mengambil reminder" },
            { status: 500 }
        );
    }
}

// POST - Membuat reminder baru
export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "JSON tidak valid" },
            { status: 400 }
        );
    }

    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        return NextResponse.json(
            { error: "Data reminder tidak valid" },
            { status: 400 }
        );
    }

    const { title, description, dueAt } = body as
        Record<string, unknown>;

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

    try {
        const now = new Date().toISOString();

        const result = db.prepare(`
      INSERT INTO reminders (
        title,
        description,
        due_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
            title.trim(),
            typeof description === "string"
                ? description
                : null,
            new Date(dueAt).toISOString(),
            now,
            now
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
