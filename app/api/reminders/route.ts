
import { NextResponse } from "next/server";
import { getDb } from "../../config/database";
import type { Reminder } from "../../models/Reminder";

// =====================================
// GET - Mengambil semua reminder
// =====================================

export async function GET() {
    try {
        const db = getDb();

        const result = await db.execute(`
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
    `);

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

        return NextResponse.json(reminders, {
            status: 200,
        });

    } catch (error) {
        console.error("GET reminders error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Gagal mengambil reminder",
            },
            { status: 500 }
        );
    }
}

// =====================================
// POST - Membuat reminder baru
// =====================================

export async function POST(request: Request) {
    let body: unknown;

    // 1. Membaca JSON dari request
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            {
                success: false,
                error: "Format JSON tidak valid",
            },
            { status: 400 }
        );
    }

    // 2. Validasi struktur request
    if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
    ) {
        return NextResponse.json(
            {
                success: false,
                error: "Data reminder tidak valid",
            },
            { status: 400 }
        );
    }

    // 3. Mengambil field dari request
    const { title, description, dueAt } =
        body as Record<string, unknown>;

    // 4. Validasi nilai input
    if (
        typeof title !== "string" ||
        !title.trim() ||
        typeof dueAt !== "string" ||
        !dueAt.trim() ||
        !Number.isFinite(Date.parse(dueAt)) ||
        (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        )
    ) {
        return NextResponse.json(
            {
                success: false,
                error: "Title, description, atau tanggal tidak valid",
            },
            { status: 400 }
        );
    }

    // 5. Menyimpan ke Turso
    try {
        const db = getDb();

        const normalizedTitle = title.trim();

        const normalizedDescription =
            typeof description === "string"
                ? description.trim() || null
                : null;

        const normalizedDueAt =
            new Date(dueAt).toISOString();

        const result = await db.execute({
            sql: `
        INSERT INTO reminders (
          title,
          description,
          due_at
        )
        VALUES (?, ?, ?)
      `,
            args: [
                normalizedTitle,
                normalizedDescription,
                normalizedDueAt,
            ],
        });

        return NextResponse.json(
            {
                success: true,
                id: Number(result.lastInsertRowid),
                message: "Reminder berhasil dibuat",
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("POST reminders error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Gagal menyimpan reminder",
            },
            { status: 500 }
        );
    }
}
